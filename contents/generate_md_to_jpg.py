import os
from PIL import Image, ImageDraw, ImageFont

def wrap_text(draw, text, font, max_width):
    """Wraps text to fit within max_width and returns lines."""
    lines = []
    words = text.split()
    while words:
        line = ''
        while words and draw.textlength(line + words[0], font=font) <= max_width:
            line += (words.pop(0) + ' ')
        lines.append(line.strip())
    return lines

def text_to_image(poem_title, poem_text, output_path):
    """Generates an image from poem text and saves it as a high-quality JPEG with enhanced styling and line wrapping."""
    
    # Load fonts with larger sizes for readability
    try:
        title_font = ImageFont.truetype("Georgia Bold.ttf", 70)  # Title font
        text_font = ImageFont.truetype("Arial.ttf", 40)          # Poem text font
    except IOError:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()

    # Set margins and spacing
    margin = 60
    line_spacing = 15
    image_width = 1000  # Set a fixed width for wrapping

    # Create a temporary image to calculate text dimensions
    temp_image = Image.new("RGB", (image_width, 2000), "white")
    draw = ImageDraw.Draw(temp_image)

    # Calculate title dimensions and wrap text if necessary
    title_lines = wrap_text(draw, poem_title, title_font, image_width - 2 * margin)
    title_height = sum(draw.textbbox((0, 0), line, font=title_font)[3] for line in title_lines) + (len(title_lines) - 1) * line_spacing

    # Calculate total text height needed for the poem
    text_lines = []
    for line in poem_text.split("\n"):
        text_lines.extend(wrap_text(draw, line, text_font, image_width - 2 * margin))
    text_height = sum(draw.textbbox((0, 0), line, font=text_font)[3] for line in text_lines) + (len(text_lines) - 1) * line_spacing

    # Define image height based on calculated text height
    image_height = title_height + text_height + 3 * margin
    image = Image.new("RGB", (image_width, image_height), "white")
    draw = ImageDraw.Draw(image)

    # Draw title without shadow
    y = margin
    for line in title_lines:
        title_width = draw.textlength(line, font=title_font)
        title_x = (image_width - title_width) / 2
        draw.text((title_x, y), line, fill="darkblue", font=title_font)  # Title text without shadow
        y += draw.textbbox((0, 0), line, font=title_font)[3] + line_spacing

    # Draw poem text without shadow
    y += margin // 2
    for line in text_lines:
        line_width = draw.textlength(line, font=text_font)
        text_x = (image_width - line_width) / 2
        draw.text((text_x, y), line, fill="black", font=text_font)  # Main text without shadow
        y += draw.textbbox((0, 0), line, font=text_font)[3] + line_spacing

    # Save the image as a high-quality JPEG
    image.save(output_path, "JPEG", quality=95)

def convert_md_to_jpg(input_folder, output_folder):
    """Converts all markdown (.md) files in a folder to high-quality JPEG images in the specified output folder."""
    os.makedirs(output_folder, exist_ok=True)
    
    md_files = [f for f in os.listdir(input_folder) if f.endswith('.md')]
    
    for md_file in md_files:
        md_path = os.path.join(input_folder, md_file)
        with open(md_path, 'r') as file:
            content = file.read()

        poem_title = os.path.splitext(md_file)[0]
        output_path = os.path.join(output_folder, f"{poem_title}.jpg")
        
        # Generate and save the image
        text_to_image(poem_title, content, output_path)
        print(f"Generated {output_path}")

# Folder paths for input (markdown files) and output (JPEG images)
input_folder = "/Users/chengyang/Desktop/COMS6998008WEB3BLOCKCHAIN/contents/poem"
output_folder = "/Users/chengyang/Desktop/COMS6998008WEB3BLOCKCHAIN/contents/poem_jpg"

# Run the conversion
convert_md_to_jpg(input_folder, output_folder)
