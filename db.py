import yaml

from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.orm import Session


with open("secrets.yaml", "r") as yaml_file:
    config = yaml.safe_load(yaml_file)
    # SQLite database URL
    if config["llm"]:
        SQLALCHEMY_DATABASE_URL = "sqlite:///./llm.db"
    else:
        SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"



# Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# Create a sessionmaker to handle database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for declarative class definitions
Base = declarative_base()


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    priority = Column(Integer, nullable=True)
    note_link = Column(String, nullable=True)
    description = Column(String, nullable=True)
    related_text = Column(String, nullable=True)
    url = Column(String, nullable=True)


def get_all_tasks(db: Session):
    return db.query(Task).all()


# Create the database tables
Base.metadata.create_all(bind=engine)


# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



