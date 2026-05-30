from sqlalchemy import Column, Integer, String, Float, Text, JSON
from database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    goodreads_id = Column(Integer, unique=True, nullable=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    isbn = Column(String, nullable=True)
    isbn13 = Column(String, nullable=True)

    description = Column(Text, nullable=True)
    genres = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    page_count = Column(Integer, nullable=True)
    published_date = Column(String, nullable=True)
    publisher = Column(String, nullable=True)

    my_rating = Column(Float, nullable=True)
    date_read = Column(String, nullable=True)
    date_added = Column(String, nullable=True)
    shelf = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    embedding = Column(JSON, nullable=True)
