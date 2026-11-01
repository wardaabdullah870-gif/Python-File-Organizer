from datetime import datetime
import os
import shutil

print("=" * 45)
print("       AUTOMATIC FILE ORGANIZER")
print("=" * 45)

folder_path = input(
    "Enter the folder path you want to organize: "
).strip().strip('"')
log_file = "organizer_log.txt"

file_types = {
    "Documents": [".pdf", ".docx", ".txt", ".xlsx", ".pptx"],
    "Images": [".jpg", ".jpeg", ".png", ".gif"],
    "Videos": [".mp4", ".avi", ".mkv"],
    "Music": [".mp3", ".wav"],
    "Archives": [".zip", ".rar", ".7z"]
}

if os.path.exists(folder_path):

    counts = {category: 0 for category in file_types}
    counts["Others"] = 0

    files = os.listdir(folder_path)

    for file in files:

        file_path = os.path.join(folder_path, file)

        if os.path.isfile(file_path):

            extension = os.path.splitext(file)[1].lower()

            category = "Others"

            for folder, extensions in file_types.items():

                if extension in extensions:
                    category = folder
                    break

            destination_folder = os.path.join(
                folder_path, category
            )

            os.makedirs(destination_folder, exist_ok=True)

            destination_path = os.path.join(
                destination_folder, file
            )

            # Prevent overwriting existing files
            if os.path.exists(destination_path):
                print("Skipped duplicate:", file)
                continue

            shutil.move(file_path, destination_path)

            counts[category] += 1

            print("Moved:", file, "->", category)

            with open(log_file, "a", encoding="utf-8") as log:
                log.write(
                    f"{datetime.now()} | {file} | {category}\n"
    )

    total = 0

    for category, count in counts.items():
        print(category, ":", count)
        total += count

    print("-" * 45)
    print("Total files organized:", total)
    print("Organization completed successfully!")

else:
    print("Folder does not exist!")
