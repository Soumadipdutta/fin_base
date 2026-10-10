from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

#Import models so that their are base are registered
from app.models import Account, Company, Invoice, Obligation  # noqa: E402, F401