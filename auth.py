from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException

SECRET_KEY = "medislot_super_secret_key"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

bcrypt_context = CryptContext(
    schemes=['bcrypt'],
    deprecated='auto'
)

oauth2_bearer = OAuth2PasswordBearer(
    tokenUrl='login'
)

def hash_password(password: str):

    return bcrypt_context.hash(password[:72])



def verify_password(
    plain_password,
    hashed_password
):

    return bcrypt_context.verify(
    plain_password[:72],
    hashed_password
)

def get_current_user(token: str = Depends(oauth2_bearer)):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        phone_number = payload.get("sub")

        patient_id = payload.get("id")

        if phone_number is None or patient_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return {
            "phone_number": phone_number,
            "id": patient_id
        }

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

def create_access_token(
    phone_number: str,
    patient_id: int
):

    encode = {
        "sub": phone_number,
        "id": patient_id
    }

    expires = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    encode.update({
        "exp": expires
    })

    return jwt.encode(
        encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    