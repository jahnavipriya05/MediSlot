# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import create_engine

# # db_url = "mysql+pymysql://root:jaanu@localhost/Medislot"
# engine = create_engine(db_url)
# session = sessionmaker(
#     autoflush= False,
#     autocommit = False,
#     bind = engine
# )

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./medislot.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)