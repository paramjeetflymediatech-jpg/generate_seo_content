import json
import os

def generate_seo(location, services):
    clean_services = []
    for s in services:
        if not s.startswith("Find "):
            # Remove " in Location" from the end
            clean_name = s.split(" in ")[0]
            clean_services.append(clean_name)
    
    clean_services = sorted(list(set(clean_services))) # unique and sorted
    services_str = ", ".join(clean_services[:3])
    
    title = f"Top Rated {services_str} in {location} | RoofRepair"
    description = f"Looking for expert roofing in {location}? We specialize in {', '.join(clean_services)}. Get professional service and a free estimate today!"
    keywords = ", ".join([f"{s} {location}" for s in clean_services])
    
    return {
        "title": title,
        "description": description,
        "keywords": keywords
    }

def generate_faq(location, services):
    clean_services = []
    for s in services:
        if not s.startswith("Find "):
            clean_name = s.split(" in ")[0]
            clean_services.append(clean_name)
    clean_services = sorted(list(set(clean_services)))
    
    faqs = []
    if clean_services:
        faqs.append({
            "question": f"What roofing services do you offer in {location}?",
            "answer": f"We offer a wide range of services in {location}, including {', '.join(clean_services)}. Our team is experienced in both residential and commercial roofing."
        })
        faqs.append({
            "question": f"Do you provide emergency roof repairs in {location}?",
            "answer": f"Yes, we offer emergency roof leak repair and urgent roofing services across {location} to protect your home from water damage."
        })
        faqs.append({
            "question": f"How can I get a quote for a new roof in {location}?",
            "answer": "Getting a quote is easy! Simply fill out our online form or give us a call, and we will schedule a professional inspection to provide you with an accurate estimate."
        })
    return faqs

def generate_content(location, services):
    clean_services = []
    for s in services:
        if not s.startswith("Find "):
            clean_name = s.split(" in ")[0]
            clean_services.append(clean_name)
    clean_services = sorted(list(set(clean_services)))
    
    content = f"Experience premium roofing excellence in {location}. We are dedicated to providing the highest quality {', '.join(clean_services)} for both residential and commercial properties. "
    content += f"Our team of certified professionals in {location} understands the local climate and architectural needs, ensuring that every project—from {clean_services[0] if clean_services else 'roof repairs'} to {clean_services[-1] if clean_services else 'installations'}—is handled with precision and care. "
    content += "We utilize advanced materials and industry-leading techniques to deliver durable, aesthetically pleasing results that enhance your property's value and protection."
    
    return content

def main():
    input_file = "public/services.json"
    output_file = "public/services_mapped.json"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found")
        return

    with open(input_file, 'r') as f:
        data = json.load(f)

    mapped_data = {}
    for location, services in data.items():
        # Filter services to remove the "Find ... Companies" variants
        clean_services_list = []
        for s in services:
            if not s.startswith("Find "):
                clean_name = s.split(" in ")[0]
                clean_services_list.append(clean_name)
        clean_services_list = sorted(list(set(clean_services_list)))
        
        mapped_data[location] = {
            "location": location,
            "services": clean_services_list,
            "seo": generate_seo(location, services),
            "faq": generate_faq(location, services),
            "content": generate_content(location, services)
        }

    with open(output_file, 'w') as f:
        json.dump(mapped_data, f, indent=2)

    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    main()
