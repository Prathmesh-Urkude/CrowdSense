from sqlalchemy  import Column, ForeignKey, Text, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
from pg_db import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    image_url = Column(Text)

    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    status = Column(String(20), nullable=False, default="pending")

    created_by = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)

class Upvote(Base):
    __tablename__ = "upvotes"

    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String(100), nullable=False, primary_key=True)
    created_at = Column(TIMESTAMP, nullable=False)