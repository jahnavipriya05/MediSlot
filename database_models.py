from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column,Integer,Float,String, ForeignKey

Base = declarative_base()

class Doctor(Base):
    __tablename__ = "Doctor"
    id = Column(Integer, primary_key= True, index=True)
    name = Column(String(100))
    email = Column(String(30))
    specialization = Column(String(500))

class Appointment(Base):
    __tablename__ = "Appointment"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("Patient.id"))
    doctor_id = Column(Integer, ForeignKey("Doctor.id"))
    date = Column(String(20))
    time = Column(String(20))
    
class Patient(Base):
    __tablename__ = "Patient"
    id = Column(Integer, primary_key=True,index=True)
    name = Column(String(100))
    patient_code = Column(String(20), unique=True)
    age = Column(Integer)
    gender = Column(String(20))
    phone_number = Column(String(20))
    email = Column(String(30))
    password = Column(String(100))
    
class Users(Base):
    __tablename__ = "Users"
    id = Column(Integer,primary_key=True,index=True)
    phone_number = Column(String(100),unique=True)
    password = Column(String(100))
    role = Column(String(20))