from sqlalchemy import Column, Integer, String, Float, Boolean, TIMESTAMP
from sqlalchemy.dialects.postgresql import ARRAY, VARCHAR
from protocol.Utils.dbconnection import Base

# Data Frames
class DataFrame(Base):
    __tablename__ = "data_frames"

    id = Column(Integer, primary_key=True)
    time = Column(TIMESTAMP)
    identifier = Column(VARCHAR(128))
    numberofpmu = Column(Integer)
    streamid = Column(Integer)
    dataid = Column(ARRAY(Integer))
    frequency = Column(ARRAY(Float))
    rocof = Column(ARRAY(Float))
    dataerror = Column(ARRAY(VARCHAR))
    timequality = Column(ARRAY(VARCHAR))
    pmusync = Column(ARRAY(Boolean))
    triggerreason = Column(VARCHAR)

class InertiaDistribution(Base):
    __tablename__ = "inertia_distribution"

    id = Column(Integer, primary_key=True)
    time = Column(TIMESTAMP)
    identifier = Column(VARCHAR(128))
    numberofpmu = Column(Integer)
    stationnames = Column(ARRAY(VARCHAR))
    d_k = Column(ARRAY(Float))
    idi = Column(ARRAY(Float))

# Configuration Frames
class ConfigurationFrame(Base):
    __tablename__ = "configuration_frames"

    id = Column(Integer, primary_key=True)
    time = Column(TIMESTAMP)
    identifier = Column(VARCHAR(128))
    frameversion = Column(Integer)
    streamid = Column(Integer)
    datarate = Column(Integer)
    numberofpmu = Column(Integer)
    stationname = Column(ARRAY(VARCHAR))
    dataid = Column(ARRAY(Integer))
    nominalfrequency = Column(ARRAY(Integer))

# Oscillatory Events
class OscillatoryEvent(Base):
    __tablename__ = "oscillatory_events"

    id = Column(Integer, primary_key=True)
    identifier = Column(VARCHAR(128))
    stationname = Column(VARCHAR(128))
    frequency = Column(ARRAY(Float))
    power = Column(ARRAY(Float))
    fftfrequency = Column(ARRAY(Float))
    time = Column(ARRAY(TIMESTAMP))
    threshold = Column(Float)

# Islanding Events
class IslandingEvent(Base):
    __tablename__ = "islanding_events"

    id = Column(Integer, primary_key=True)
    identifier = Column(VARCHAR(128))
    stationscount = Column(Integer)
    stationnames = Column(ARRAY(VARCHAR(128)))
    frequency = Column(ARRAY(Float, dimensions=2))
    time = Column(ARRAY(TIMESTAMP))
    threshold = Column(Float)

# Generator Loss Events
class GenLossEvent(Base):
    __tablename__ = "genloss_events"

    id = Column(Integer, primary_key=True)
    identifier = Column(VARCHAR(128))
    stationname = Column(VARCHAR(128))
    frequency = Column(ARRAY(Float))
    time = Column(ARRAY(TIMESTAMP))
    threshold = Column(Float)

# Load Loss Events
class LoadLossEvent(Base):
    __tablename__ = "loadloss_events"

    id = Column(Integer, primary_key=True)
    identifier = Column(VARCHAR(128))
    stationname = Column(VARCHAR(128))
    frequency = Column(ARRAY(Float))
    time = Column(ARRAY(TIMESTAMP))
    threshold = Column(Float)

# Impulse Events
class ImpulseEvent(Base):
    __tablename__ = "impulse_events"

    id = Column(Integer, primary_key=True)
    identifier = Column(VARCHAR(128))
    stationname = Column(VARCHAR(128))
    frequency = Column(ARRAY(Float))
    rocof = Column(ARRAY(Float))
    time = Column(ARRAY(TIMESTAMP))
    threshold = Column(Float)
