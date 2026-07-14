import argparse
try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    print("The 'pypdf' library is required. Please install it using: pip install pypdf")
    exit(1)

def unlock_pdf(input_path, output_path, password):
    try:
        reader = PdfReader(input_path)
        
        if not reader.is_encrypted:
            print(f"The file {input_path} is not encrypted.")
            return

        # Attempt to decrypt
        decrypted = reader.decrypt(password)
        if not decrypted:
            print(f"Failed to decrypt {input_path}. Incorrect password?")
            return
            
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
            
        with open(output_path, "wb") as f:
            writer.write(f)
            
        print(f"Successfully unlocked PDF. Saved to:\n{output_path}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Unlock a password-protected PDF.")
    parser.add_argument("-i", "--input", help="Input PDF file path")
    parser.add_argument("-o", "--output", help="Output PDF file path")
    parser.add_argument("-p", "--password", help="Password to unlock the PDF")
    
    args = parser.parse_args()
    
    # Defaults based on the user's specific request if arguments are not provided
    input_file = args.input or r"m:\Workspace\My-Web-Site-Application\Scripts\VCBL_Detail_XXXX208826_14-Jul-2026-08-21-36-am.pdf"
    output_file = args.output or r"m:\Workspace\My-Web-Site-Application\Scripts\VCBL_Detail_XXXX208826_14-Jul-2026-08-21-36-am_unlocked.pdf"
    password = args.password or "1191530"
    
    unlock_pdf(input_file, output_file, password)
