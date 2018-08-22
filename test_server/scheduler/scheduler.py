import csv
import json

filename = "schedule1.csv"

flat_json = []

output = []

cur_block = 0;
video_index = 0;

with open(filename, 'rb') as schedule_file:
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
	print output

	with open('data.json', 'w') as outfile:
		json.dump(output, outfile)

						



		# 				output[cur_block-1][videos][attr]

		# print output
		# print "------------------"











# 		else:
# 			flat_json.append(dict(zip(field_names,row)))
# 	print flat_json


# for row in flat_json:
# 	if 
			
