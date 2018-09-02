import csv
import json
import os
import subprocess
import re
from decimal import Decimal
import argparse
from yattag import Doc
import urllib
import urlparse
import isodate


def get_video_length(path):
	path = re.escape(path)
	cmd = 'ffprobe -i ' + path + ' -show_entries format=duration -v quiet -of csv="p=0"'
	result = subprocess.Popen(cmd, stdout=subprocess.PIPE,stderr=subprocess.STDOUT,shell=True)
	output = result.communicate()
	return float(output[0])*1000


YOUTUBE_API_KEY = "AIzaSyBNiJ9LRO4Kz2QvP7XelKByB6ZW0klj9Q8"

def get_youtube_id_from_url(url) :
	url_data = urlparse.urlparse(url)
	query = urlparse.parse_qs(url_data.query)
	video = query["v"][0]
	return video

def get_youtube_video_length(url):
	video_id= get_youtube_id_from_url(url)
	api_key= YOUTUBE_API_KEY
	searchUrl="https://www.googleapis.com/youtube/v3/videos?id="+video_id+"&key="+api_key+"&part=contentDetails"
	response = urllib.urlopen(searchUrl).read()
	data = json.loads(response)
	all_data=data['items']
	contentDetails=all_data[0]['contentDetails']
	print contentDetails
	duration= isodate.parse_duration(contentDetails['duration']).total_seconds() * 1000

	return duration


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

parser = argparse.ArgumentParser()
parser.add_argument("input", help="schedule CSV to be parsed into JSON")
parser.add_argument("output", help="output JSON filename")
args = parser.parse_args()
INPUT_FILENAME = args.input
OUTPUT_FILENAME = args.output
output = []

cur_block = 0;
video_index = 0;

with open(INPUT_FILENAME, 'rb') as schedule_file:
	schedule_reader = csv.reader(schedule_file, delimiter=',')
	for i, row in enumerate(schedule_reader):
		if i == 0: 
			field_names = row
		else: 
			for j, item in enumerate(row):
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
			video_index += 1;

for block in output:
	for i, video in enumerate(block["videos"]):
		if i != 0:
			video["startTime"] = add_millis_to_date_string(block["startTime"], int(duration))
		else: 
			video["startTime"] = block["startTime"]
		#print video
		if is_url(video["filename"]) :
			print "getting youtube duration!!!!!!!"
			duration = get_youtube_video_length(video["filename"])
			print duration
		else:
			duration = get_video_length( os.path.join("../../media", video["filename"]) )
		video["duration"] = duration


output_json_filename = os.path.join( "../../schedule", os.path.splitext( os.path.basename(OUTPUT_FILENAME) )[0] + ".json")

with open(output_json_filename, 'w') as outfile:
	json.dump(output, outfile)


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
										text(video['startTime'][0:8])
									with tag('td', klass="video-title"):
										text(video['title'])
										with tag('p', klass="video-author"):
											text(video['author'])
									with tag('td', klass="video-description"):
										text(video['description'])

	output_html_filename = os.path.join( "../../schedule", os.path.splitext( os.path.basename(OUTPUT_FILENAME) )[0] + "_schedule_table.html")
	file = open(output_html_filename,'w')
	file.write(doc.getvalue())
	#print(doc.getvalue()) 

generate_html_schedule(output_json_filename)











