from pydantic import BaseModel

class Doctor(BaseModel):
    name : str
    email : str
    specialization : str

class Appointment(BaseModel):
    doctor_id : int
    date : str
    time : str

class Patient(BaseModel):
    name : str
    age : int
    gender : str
    phone_number : str
    email : str
    password : str

class UserLogin(BaseModel):
    phone_number: str
    password: str