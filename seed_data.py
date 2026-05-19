from database import SessionLocal
from models import Doctor, Patient

db = SessionLocal()

# -------------------- DOCTORS --------------------

doctors = [

    Doctor(name="Sadwi", email="sadwi.medislot@gmail.com", specialization="Gynecologist"),

    Doctor(name="Sakura", email="sakura.medislot@gmail.com", specialization="Pediatrician"),

    Doctor(name="Vashikaran", email="vashikaran.medislot@gmail.com", specialization="General surgeon"),

    Doctor(name="Adithi Sharma", email="adithi.medislot@gmail.com", specialization="General surgeon"),

    Doctor(name="Mahi", email="mahi.medislot@gmail.com", specialization="ENT Specialist"),

    Doctor(name="Ashish", email="ashish.medislot@gmail.com", specialization="Dermatologist"),

    Doctor(name="Jahnavi", email="jahnavi.medislot@gmail.com", specialization="Gastroenterologist"),

    Doctor(name="Harsha Vardhini", email="harsha.medislot@gmail.com", specialization="Neurologist"),

    Doctor(name="Anusha", email="anusha.medislot@gmail.com", specialization="Cardiology"),

    Doctor(name="Rohit", email="rohit.medislot@gmail.com", specialization="Dentist"),

    Doctor(name="Kiran", email="kiran.medislot@gmail.com", specialization="Orthopedic"),

    Doctor(name="Sneha", email="sneha.medislot@gmail.com", specialization="Psychiatrist"),

    Doctor(name="Vivek", email="vivek.medislot@gmail.com", specialization="Cardiologist"),

    Doctor(name="Deepika", email="deepika.medislot@gmail.com", specialization="Ophthalmologist"),

    Doctor(name="Rahul", email="rahul.medislot@gmail.com", specialization="Urologist"),

    Doctor(name="Keerthi", email="keerthi.medislot@gmail.com", specialization="Pulmonologist"),

    Doctor(name="Nithin", email="nithin.medislot@gmail.com", specialization="Radiologist"),

    Doctor(name="Lavanya", email="lavanya.medislot@gmail.com", specialization="Oncologist"),

    Doctor(name="Tarun", email="tarun.medislot@gmail.com", specialization="Nephrologist"),

    Doctor(name="Pooja", email="pooja.medislot@gmail.com", specialization="Physiotherapist")
]

# -------------------- PATIENTS --------------------

# patients = [

#     Patient(
#         name="Ramesh",
#         email="ramesh.patient@gmail.com",
#         age=45,
#         gender="Male"
#     ),

#     Patient(
#         name="Sravani",
#         email="sravani.patient@gmail.com",
#         age=28,
#         gender="Female"
#     )
# ]

# -------------------- INSERT --------------------

db.add_all(doctors)
# db.add_all(patients)

db.commit()

print("20 doctors inserted successfully!")