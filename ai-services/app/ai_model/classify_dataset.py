'''import os
import shutil
import xml.etree.ElementTree as ET

IMAGES_DIR = "images"
ANNOTATIONS_DIR = "annotations"
OUTPUT_DIR = "dataset"

POTHOLE_DIR = os.path.join(OUTPUT_DIR, "pothole")
NORMAL_DIR = os.path.join(OUTPUT_DIR, "normal")

os.makedirs(POTHOLE_DIR, exist_ok=True)
os.makedirs(NORMAL_DIR, exist_ok=True)

def parse_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    filename = root.find("filename").text.strip()
    has_pothole = False

    for obj in root.findall("object"):
        name = obj.find("name")
        if name is not None and name.text.lower() == "pothole":
            has_pothole = True
            break

    return filename, has_pothole

pothole_count = 0
normal_count = 0
missing_images = 0

for xml_file in os.listdir(ANNOTATIONS_DIR):
    if not xml_file.endswith(".xml"):
        continue

    xml_path = os.path.join(ANNOTATIONS_DIR, xml_file)

    image_name, is_pothole = parse_xml(xml_path)
    image_path = os.path.join(IMAGES_DIR, image_name)

    if not os.path.exists(image_path):
        missing_images += 1
        continue

    if is_pothole:
        shutil.copy(image_path, POTHOLE_DIR)
        pothole_count += 1
    else:
        shutil.copy(image_path, NORMAL_DIR)
        normal_count += 1

print("Dataset classification complete ")
print("Pothole images:", pothole_count)
print("Normal images:", normal_count)
print("Missing images:", missing_images)
'''
import os
import shutil
import xml.etree.ElementTree as ET

IMAGES_DIR = "images"
ANNOTATIONS_DIR = "annotations/xmls"
OUTPUT_DIR = "dataset"

CLASSES = {
    "D00": "longitudinal_crack",
    "D10": "transverse_crack",
    "D20": "alligator_crack",
    "D40": "pothole"
}

os.makedirs(os.path.join(OUTPUT_DIR, "normal"), exist_ok=True)
for cls in CLASSES.values():
    os.makedirs(os.path.join(OUTPUT_DIR, cls), exist_ok=True)

def parse_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    filename = root.find("filename").text.strip()
    labels = set()

    for obj in root.findall("object"):
        name = obj.find("name")
        if name is not None:
            labels.add(name.text.strip())

    return filename, labels


counts = {k: 0 for k in ["normal"] + list(CLASSES.values())}
for xml_file in os.listdir(ANNOTATIONS_DIR):
    if not xml_file.endswith(".xml"):
        continue

    xml_path = os.path.join(ANNOTATIONS_DIR, xml_file)
    image_name, labels = parse_xml(xml_path)
    image_path = os.path.join(IMAGES_DIR, image_name)

    if not os.path.exists(image_path):
        continue

    matched = False

    for code, folder in CLASSES.items():
        if code in labels:
            shutil.copy(image_path, os.path.join(OUTPUT_DIR, folder))
            counts[folder] += 1
            matched = True
            break

    if not matched:
        shutil.copy(image_path, os.path.join(OUTPUT_DIR, "normal"))
        counts["normal"] += 1

print("Dataset classification complete ")
for k, v in counts.items():
    print(f"{k}: {v}")