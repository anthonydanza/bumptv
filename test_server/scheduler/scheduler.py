import csv
import json
import os
import subprocess
import re
from decimal import Decimal
import argparse
from yattag import Doc


def get_video_length(path):
	path = re.escape(path)
	cmd = 'ffprobe -i ' + path + ' -show_entries format=duration -v quiet -of csv="p=0"'
	result = subprocess.Popen(cmd, stdout=subprocess.PIPE,stderr=subprocess.STDOUT,shell=True)
	output = result.communicate()
	return float(output[0])*1000

def add_millis_to_date_string(date_string,millis):
	d = [int(i) for i in date_string.split(":")]
	total_millis = d[0]*3600000 + d[1]*60000 + d[2]*1000 + d[3] + millis

	milliseconds = str( total_millis % 1000 ).zfill(2)
	seconds = str( (total_millis / 1000) % 60 ).zfill(2)
	minutes = str( (total_millis / (1000*60)) % 60 ).zfill(2)
	hours = str( (total_millis / (1000*60*60)) % 60 ).zfill(2)

	return ':'.join([hours, minutes, seconds, milliseconds])


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

		duration = get_video_length( os.path.join("../../media", video["filename"]) );
		video["duration"] = duration

#print output	

output_json_filename = os.path.join( "../../schedule", os.path.splitext( os.path.basename(OUTPUT_FILENAME) )[0] + ".json")

with open(output_json_filename, 'w') as outfile:
	json.dump(output, outfile)


DOTW = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]


def generate_html_schedule(schedule_JSON):


	doc, tag, text = Doc().tagtext()


	with open(schedule_JSON) as json_data:
		schedule = json.load(json_data)
		print schedule

		doc, tag, text = Doc().tagtext()

		# doc.asis('<!DOCTYPE html>')
		# with tag('html', lang="en"):
		# 	with tag('head'):
		# 		#doc.asis('xmlns="http://www.w3.org/1999/xhtml" xmlns:fb="http://ogp.me/ns/fb#"')
		# 		doc.asis('<meta charset="utf-8">')
		# 		doc.asis('<meta name="viewport" content="width=device-width, initial-scale=1">')
		# 		doc.asis('<meta property="og:image" content="img/fb_preview_img.png" />')
		# 		doc.asis('<link rel="stylesheet" href="css/style.css">')
		# 		doc.asis('<link href="https://fonts.googleapis.com/css?family=Anonymous+Pro|IBM+Plex+Mono|IBM+Plex+Sans+Condensed|Inconsolata|Kavivanar|Oxygen+Mono|Tajawal|VT323" rel="stylesheet">')
		# 		with tag('title'):
		# 			text('SCHEDULE')
		# 	with tag('body'):
		# 		with tag('script', src="schedule.js"):
		# 			pass
		# 		with tag('div', id="container"):
		# 			with tag('div', id="schedule"):
		# with tag('table', id="schedule"):
		# 	with tag('tr', klass="day-row"):
		# 		for day in DOTW:
		# 			with tag('td', klass="day"):
		# 				with tag('a', klass="day", href="/schedule.html?d="+day, id=day):
		# 					text(day)
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
										
							# for person in person_suite:
							# 	print("Adding photos for user {0}".format(person.uid))
							# 	with tag('div', klass='row'):
							# 		for photo in person.photos:
							# 			with tag('div', klass="col-xs-1", style="padding-left: 5px; padding-right: 5px; padding-top: 5px; padding-bottom: 5px;"):
							# 			   with tag('p'):
							# 				   with tag('a', href=person.profile_url, target="_blank"):
							# 					   doc.stag('img', src=photo, height="175", width="175")
	output_html_filename = os.path.join( "../../schedule", os.path.splitext( os.path.basename(OUTPUT_FILENAME) )[0] + "_schedule_table.html")
	file = open(output_html_filename,'w')
	file.write(doc.getvalue())
	print(doc.getvalue()) 

generate_html_schedule(output_json_filename)











