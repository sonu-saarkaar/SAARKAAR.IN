import os
import re

directories_to_scan = [
    r"c:\Users\Sonu Bhai\Desktop\Project\SAARKAAR.IN\frontend\src",
    r"c:\Users\Sonu Bhai\Desktop\Project\SAARKAAR.IN\backend\app"
]

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace('Receptionist', 'Assistant')
    new_content = new_content.replace('receptionist', 'assistant')
    new_content = new_content.replace('RECEPTIONIST', 'ASSISTANT')
    new_content = new_content.replace('Aalisha', 'Alisha')
    new_content = new_content.replace('aalisha', 'alisha')

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated content in {file_path}")

    # Check filename
    basename = os.path.basename(file_path)
    new_basename = basename.replace('Receptionist', 'Assistant').replace('receptionist', 'assistant').replace('Aalisha', 'Alisha').replace('aalisha', 'alisha')

    if new_basename != basename:
        new_file_path = os.path.join(os.path.dirname(file_path), new_basename)
        os.rename(file_path, new_file_path)
        print(f"Renamed file to {new_file_path}")

def scan_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            if not file_path.endswith(('.py', '.jsx', '.js', '.css', '.html', '.json', '.md')):
                continue
            process_file(file_path)

if __name__ == "__main__":
    for d in directories_to_scan:
        scan_dir(d)
    print("Done")
