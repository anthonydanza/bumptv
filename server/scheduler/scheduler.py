import csv
import json
import os
import subprocess
import shutil
import re
from decimal import Decimal
import argparse
from yattag import Doc
import urllib
import urlparse
import isodate
import vimeo
import datetime
import math

parser = argparse.ArgumentParser()
parser.add_argument("media_dir", help="where the video files are stored")
parser.add_argument("input", help="schedule CSV to be parsed into JSON")
parser.add_argument("output", help="output JSON filename")
args = parser.parse_args()
INPUT_FILENAME = args.input
OUTPUT_FILENAME = args.output
#MEDIA_DIR = "../../media"
MEDIA_DIR = args.media_dir
YOUTUBE_API_KEY = "AIzaSyBNiJ9LRO4Kz2QvP7XelKByB6ZW0klj9Q8"

v = vimeo.VimeoClient(
    token="f56711a29d92ea38a30be43e3be8b026",
    key="b107e780eab4aa51e5db252cefc939481fc4491c",
    secret="Ba3eQoaQz3FNsoaFKUsLkMGWM/4yILJkBHTwA8PN059qpcLOXF5T+sqgEYbYSfhH5lovEVg5bSULejchnGFMguoq2rIU6aMdynySsgmkRkLm5DtM+pOtC15LB45X0tAv"
)


def get_video_length(path):
	path = re.escape(path)
	cmd = 'ffprobe -i ' + path + ' -show_entries format=duration -v quiet -of csv="p=0"'
	result = subprocess.Popen(cmd, stdout=subprocess.PIPE,stderr=subprocess.STDOUT,shell=True)
	output = result.communicate()
	return float(output[0])*1000


def get_youtube_id_from_url(url) :
	url_data = urlparse.urlparse(url)
	query = urlparse.parse_qs(url_data.query)
	video = query["v"][0]
	return video


def get_youtube_video_length(url):
	video_id = get_youtube_id_from_url(url)
	api_key= YOUTUBE_API_KEY
	searchUrl="https://www.googleapis.com/youtube/v3/videos?id="+video_id+"&key="+api_key+"&part=contentDetails"
	response = urllib.urlopen(searchUrl).read()
	data = json.loads(response)
	all_data=data['items']
	contentDetails=all_data[0]['contentDetails']
	duration= isodate.parse_duration(contentDetails['duration']).total_seconds() * 1000
	return duration


def get_vimeo_video_length(url):
	video = v.get("https://api.vimeo.com/videos?links=" + url)
	r = json.loads(video.text)
	return int(r["data"][0]["duration"]) * 1000


def get_gcloud_video_length(url):
	#doesn't do shit! cross origin request problems.
	return 10


def add_millis_to_date_string(date_string,millis):
	d = [int(i) for i in date_string.split(":")]
	total_millis = d[0]*3600000 + d[1]*60000 + d[2]*1000 + d[3] + millis

	milliseconds = str( total_millis % 1000 ).zfill(2)
	seconds = str( (total_millis / 1000) % 60 ).zfill(2)
	minutes = str( (total_millis / (1000*60)) % 60 ).zfill(2)
	hours = str( (total_millis / (1000*60*60)) % 60 ).zfill(2)

	return ':'.join([hours, minutes, seconds, milliseconds])


def is_url(url_string):
	regex = re.compile(
	    r'^(?:http|ftp)s?://' # http:// or https://
	    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' #domain...
	    r'localhost|' #localhost...
	    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' # ...or ip
	    r'(?::\d+)?' # optional port
	    r'(?:/?|[/?]\S+)$', re.IGNORECASE)

	return re.match(regex, url_string) is not None


def get_video_duration(filepath):
	print filepath
	duration = 0
	if filepath != "":
		filepath = filepath.rstrip()
		if is_url(filepath): #and video["duration"] is None:
			if "youtube" in filepath:
				duration = get_youtube_video_length(filepath)
			elif "vimeo" in filepath:
				duration = get_vimeo_video_length(filepath)
			elif "storage.googleapis.com" in filepath:
				duration = get_gcloud_video_length(filepath)
			else: 
				print "UNSUPPORTED VIDEO LINK"
		else:
			duration = get_video_length( os.path.join(MEDIA_DIR, filepath) )
	else:
		print "NO FILENAME PROVIDED FOR ", video
	return duration


def get_csv_fieldnames(csvfile):
	with open(csvfile, 'rb') as input_csv:
		reader = csv.reader(input_csv)
		fieldnames = reader.next()
		return fieldnames


#find any missing durations
def fill_out_durations(csvfile):

	schedule_reader = 0
	output_filename = "new_" + INPUT_FILENAME
	duration_dict = {}
	fieldnames = get_csv_fieldnames(csvfile)

	with open(csvfile, 'rb') as input_csv, open(output_filename,'w') as output_csv:

		# copy fieldnames to new file
		writer = csv.writer(output_csv, delimiter=',')
		writer.writerow(fieldnames)

		#go through and find durations, adding them to new csv
		input_csv_dict_reader = csv.DictReader(input_csv, delimiter=',')
		output_csv_dict_writer = csv.DictWriter(output_csv,fieldnames=fieldnames, delimiter=',')
		for i, row in enumerate(input_csv_dict_reader):
			print i, row
			if row["videos_duration"] == "":
				if row["videos_filename"] in duration_dict:
					row["videos_duration"] = duration_dict[row["videos_filename"]]
				else:
					duration = get_video_duration(row["videos_filename"])
					duration_seconds = int(math.ceil(duration/1000.0))
					formatted_duration = str(datetime.timedelta(0, duration_seconds)).zfill(8)
					duration_dict[row["videos_filename"]] = formatted_duration
					row["videos_duration"] = formatted_duration
			else: 
				duration_dict[row["videos_filename"]] = row["videos_duration"]
			output_csv_dict_writer.writerow(row)

	shutil.copy(output_filename, csvfile)


def hms_datestring_to_millis(hms_datestring):
	hms = hms_datestring.split(':')
	millis = int(hms[0])*3600000 + int(hms[1])*60000 + int(hms[2])*1000
	return millis


#convert to json
def generate_json_schedule(input_filename):
	output = []
	cur_block = 0;
	video_index = 0;
	with open(input_filename, 'rb') as schedule_file:
		schedule_reader = csv.reader(schedule_file, delimiter=',')
		for i, row in enumerate(schedule_reader):
			if i == 0: 
				field_names = row
			else: 
				for j, item in enumerate(row):
					item = item.rstrip() 
					if j == 0 and row[j]:
							cur_block += 1
							video_index = 0;
							output.append({field_names[0]:row[0]})
					else:
						if '_' not in field_names[j]:
							if row[j]:
								output[cur_block-1][field_names[j]] = item
						else: 
							videos = field_names[j].split('_')[0]
							attr = field_names[j].split('_')[1]

							if not videos in output[cur_block-1]:
								output[cur_block-1][videos] = [{attr:item}]
							else:
								if len(output[cur_block-1][videos]) <= video_index:
									 output[cur_block-1][videos].append({})
								output[cur_block-1][videos][video_index][attr] = item
				video_index += 1

		for block in output:
			for i, video in enumerate(block["videos"]):
				print video
				video["duration"] = hms_datestring_to_millis(video["duration"])
				if i != 0:
					print "d: ", block["videos"][i-1]["duration"]					
					video["startTime"] = add_millis_to_date_string(block["videos"][i-1]["startTime"], block["videos"][i-1]["duration"])
				else: 
					video["startTime"] = block["startTime"]
				
		output_json_filename = os.path.join( "../../schedule", os.path.splitext( os.path.basename(OUTPUT_FILENAME) )[0] + ".json")

		with open(output_json_filename, 'w') as outfile:
			json.dump(output, outfile)

		return output_json_filename


def fix_relative_link(url):
	if url.startswith("http"):
		return url
	else:
		url = urlparse.urlparse(url, "http").geturl()
		return url


def generate_html_schedule(schedule_JSON):

	doc, tag, text = Doc().tagtext()

	with open(schedule_JSON) as json_data:
		schedule = json.load(json_data)
		print schedule

		doc, tag, text = Doc().tagtext()

		with tag('table', id="schedule-table"):
			for block in schedule:	
				with tag('tr', klass="block-row"):
					# with tag('td', klass="block-start-time"):	
					# 	text(block['startTime'][0:8])
					with tag('td', klass="block-title"):
						text(block['blockTitle'])
					with tag('td', klass="video-list-cell"):
						with tag('table', klass="video-list"):
							for video in block['videos']:
								with tag('tr', klass="video-row"):
									with tag('td', klass="video-start-time"):
										with tag('a', klass="start-time-anchor", id=video["startTime"]):
											text(video['startTime'][0:8])
									with tag('td', klass="video-title"):
										text(video['title'])
										with tag('p', klass="video-author"):
											video["authorLink"] = fix_relative_link(video["authorLink"])
											with tag('a', klass="video-author", href=video["authorLink"]):
												text(video["author"])
									with tag('td', klass="video-description"):
										text(video['description'])

	output_html_filename = os.path.join( "../../schedule", os.path.splitext( os.path.basename(OUTPUT_FILENAME) )[0] + "_schedule_table.html")
	file = open(output_html_filename,'w')
	file.write(doc.getvalue().encode('utf-8'))

fill_out_durations(INPUT_FILENAME)

output_json_filename = generate_json_schedule(INPUT_FILENAME)

generate_html_schedule(output_json_filename)











