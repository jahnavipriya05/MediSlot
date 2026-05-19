from fastapi import  FastAPI,Depends,HTTPException
from models import Doctor, Appointment,Patient,UserLogin,UpdateProfile
# from database import session, engine
import database_models
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from auth import get_current_user
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()
app.mount(
    "/Frontend",
    StaticFiles(directory="./Frontend"),
    name="Frontend"
)

database_models.Base.metadata.create_all(bind=engine)

from auth import (
    hash_password,
    verify_password,
    create_access_token
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()

# @app.get("/")
# def home():
#     return FileResponse("Frontend/index.html")

@app.get("/")
def home():
    return FileResponse("./Frontend/index.html")

# doctor APIs
@app.get("/doctors")
def view_doctors(db: Session = Depends(get_db)):
    doctors = db.query(database_models.Doctor).all()
    return doctors
    # return {"message":"List of doctors!"}
    

@app.post("/doctor")
def add_doctors(doctor: Doctor, db: Session = Depends(get_db)):
    new_doctor = database_models.Doctor(**doctor.model_dump())
    db.add(new_doctor)
    db.commit()
    return {"message":"Doctor added successfully!"}

@app.put("/doctor")
def update_doctor(id: int, doctor : Doctor, db: Session = Depends(get_db)):
    existing_doc = db.query(database_models.Doctor).filter(database_models.Doctor.id == id).first()
    if existing_doc:
        existing_doc.name = doctor.name
        existing_doc.email = doctor.email
        existing_doc.specialization = doctor.specialization
        db.commit()
        return {"meassage": "Doctor details updated successfully"}
    raise HTTPException(status_code=404)

@app.delete("/doctor")
def delete_doctor(id:int, db: Session = Depends(get_db)):
    doctor = db.query(database_models.Doctor).filter(database_models.Doctor.id == id).first()
    if doctor:
        db.delete(doctor)
        db.commit()
        return "Doctor details deleted successfully!"
    raise HTTPException(status_code=404)



# Patient APIs
@app.get("/appointment")
def view_appointments(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    patient_id = current_user["id"]

    appointments = db.query(
        database_models.Appointment
    ).filter(
        database_models.Appointment.patient_id
        == patient_id
    ).all()

    result = []

    for appt in appointments:

        doctor = db.query(
            database_models.Doctor
        ).filter(
            database_models.Doctor.id
            == appt.doctor_id
        ).first()

        result.append({
            "id": appt.id,
            "doctor_name": doctor.name,
            "specialization": doctor.specialization,
            "date": appt.date,
            "time": appt.time
        })

    return result

@app.post("/appointment")
def apply_appointment(
    appointment: Appointment,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    patient_id = current_user["id"]

    check_doc_id = db.query(
        database_models.Doctor
    ).filter(
        database_models.Doctor.id
        == appointment.doctor_id
    ).first()

    if not check_doc_id:

        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    isExist = db.query(
        database_models.Appointment
    ).filter(
        database_models.Appointment.doctor_id
        == appointment.doctor_id,

        database_models.Appointment.date
        == appointment.date,

        database_models.Appointment.time
        == appointment.time
    ).first()

    if isExist:

        raise HTTPException(
            status_code=409,
            detail="Slot already booked"
        )

    new_appointment = database_models.Appointment(

        patient_id=patient_id,

        doctor_id=appointment.doctor_id,

        date=appointment.date,

        time=appointment.time
    )

    db.add(new_appointment)

    db.commit()

    return {
        "message": "Appointment booked successfully"
    }

@app.put("/patient")
def update_patient(id: int, patient: Patient, db: Session = Depends(get_db)):
    existing_patient = db.query(database_models.Patient).filter(database_models.Patient.id == id).first()
    if existing_patient:
        existing_patient.name = patient.name
        existing_patient.age = patient.age
        existing_patient.gender = patient.gender
        existing_patient.email = patient.email
        existing_patient.phone_number = patient.phone_number
        db.commit()
        return {"message":"Patient detils updated successfully"}
    raise HTTPException(status_code=404)

@app.delete("/appointment/{id}")
def delete_apointment(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    appointment = db.query(
        database_models.Appointment
    ).filter(
        database_models.Appointment.id == id,
        database_models.Appointment.patient_id == current_user["id"]
    ).first()

    if not appointment:

        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    db.delete(appointment)

    db.commit()

    return {
        "message": "Appointment successfully deleted!"
    }


#Appointments APIs

@app.get("/patient/me")
def get_my_profile(

    current_user: dict = Depends(get_current_user),

    db: Session = Depends(get_db)
):

    patient = db.query(
        database_models.Patient
    ).filter(
        database_models.Patient.id
        == current_user["id"]
    ).first()

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return {
        "id": patient.id,
        "name": patient.name,
        "phone_number": patient.phone_number,
        "email": patient.email
    }

@app.post("/patient")
def add_patients(
    patient: Patient,
    db: Session = Depends(get_db)
):

    existing_user = db.query(
        database_models.Patient
    ).filter(
        database_models.Patient.phone_number
        == patient.phone_number
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="Phone number already registered"
        )

    hashed_password = hash_password(
        patient.password
    )

    new_patient = database_models.Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        phone_number=patient.phone_number,
        email=patient.email,
        password=hashed_password
    )

    db.add(new_patient)

    db.commit()

    return {
        "message": "Patient registered successfully"
    }

@app.delete("/patient")
def delete_patient(id : int, db : Session = Depends(get_db)):
    patient = db.query(database_models.Patient).filter(database_models.Patient.id == id).first()
    if patient:
        db.delete(patient)
        db.commit()
        return {"meassage": "Patient details deleted successfully"}
    raise HTTPException(status_code=404)

@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = db.query(
        database_models.Patient
    ).filter(
        database_models.Patient.phone_number
        == user.phone_number
    ).first()

    if not existing_user:

        raise HTTPException(
            status_code=404,
            detail="Mobile number not found"
        )

    if not verify_password(
        user.password,
        existing_user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect password"
        )

    token = create_access_token(
        existing_user.phone_number,
        existing_user.id
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }
    
@app.put("/patient/me")
def update_patient_profile(

    profile: UpdateProfile,

    current_user: dict = Depends(get_current_user),

    db: Session = Depends(get_db)
):

    patient = db.query(
        database_models.Patient
    ).filter(
        database_models.Patient.id
        == current_user["id"]
    ).first()

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    patient.name = profile.name
    patient.email = profile.email

    db.commit()

    return {
        "message": "Profile updated successfully"
    }