import qrcode
import os

# Park locations
locations = [
    "Main Entrance",
    "Playground Area",
    "Walking Trail Start",
    "Picnic Area",
    "Parking Lot",
    "Restroom Area",
    "Fountain Area",
    "Dog Park"
]

# Base URL for your application
BASE_URL = "https://yourdomain.com/report?location="

# Create output directory
output_dir = "qr_codes"
os.makedirs(output_dir, exist_ok=True)

# Generate QR codes for each location
for location in locations:
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    url = BASE_URL + location.replace(" ", "+")
    qr.add_data(url)
    qr.make(fit=True)
    
    # Create and save image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Add location text to filename
    filename = f"{location.lower().replace(' ', '_')}_qr.png"
    filepath = os.path.join(output_dir, filename)
    
    img.save(filepath)
    print(f"Generated QR code for {location}: {filepath}")

print(f"\nAll QR codes generated in '{output_dir}' directory.")
print("Print these and place them at corresponding locations in the park.")