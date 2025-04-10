from sqlalchemy import Column, Integer, String, Float, Boolean, TIMESTAMP, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import ARRAY, VARCHAR
# from sqlalchemy.dialects.postgresql import CompositeType
from protocol.Utils.dbconnection import Base, engine

# Data Frames
class DataFrame(Base):
    __tablename__ = "data_frames"

    time = Column(TIMESTAMP, primary_key=True)
    identifier = Column(VARCHAR(128))
    numberofpmu = Column(Integer)
    streamid = Column(Integer)
    stationname = Column(ARRAY(VARCHAR))
    dataid = Column(ARRAY(Integer))
    frequency = Column(ARRAY(Float))

class InertiaDistribution(Base):
    __tablename__ = "inertia_distribution"

    time = Column(TIMESTAMP, primary_key=True)
    identifier = Column(VARCHAR(128))
    streamid = Column(Integer)
    numberofpmu = Column(Integer)
    stationname = Column(ARRAY(VARCHAR))
    d_k = Column(ARRAY(Float))
    idi = Column(Float)

# # Use after `register_pg_types()`
# PhasorUnitType = CompositeType('phasor_unit_type', [])
# AnalogUnitType = CompositeType('analog_unit_type', [])
# DigitalUnitType = CompositeType('digital_unit_type', [])
# PhasorType = CompositeType('phasor_type', [])

# # Configuration Frames
# class ConfigurationFrame(Base):
#     __tablename__ = "configuration_frames"

#     time = Column(TIMESTAMP)
#     Identifier = Column(VARCHAR(128))
#     FrameVersion = Column(Integer)
#     StreamID = Column(Integer)
#     DataRate = Column(Integer)
#     NumberOfPMU = Column(Integer)
#     StationName = Column(ARRAY(VARCHAR))
#     DataID = Column(ARRAY(Integer))
#     PhasorNumber = Column(ARRAY(Integer))
#     PhasorUnit = Column(ARRAY(PhasorUnitType))
#     AnalogNumber = Column(ARRAY(Integer))
#     AnalogUnit = Column(ARRAY(AnalogUnitType))
#     DigitalNumber = Column(ARRAY(Integer))
#     DigitalUnit = Column(ARRAY(DigitalUnitType))
#     PhasorChannelNames = Column(ARRAY(ARRAY(VARCHAR)))
#     AnalogChannelNames = Column(ARRAY(ARRAY(VARCHAR)))
#     DigitalChannelNames = Column(ARRAY(ARRAY(VARCHAR)))
#     NominalFrequency = Column(ARRAY(Integer))
#     ConfigurationChangeCount = Column(ARRAY(Integer))

# # Data Frames
# class DataFrame(Base):
#     __tablename__ = "data_frames"

#     time = Column(TIMESTAMP, primary_key=True)
#     Identifier = Column(VARCHAR(128))
#     NumberOfPMU = Column(Integer)
#     StreamID = Column(Integer)
#     StationName = Column(ARRAY(VARCHAR))
#     DataID = Column(ARRAY(Integer))
#     PhasorChannelNames = Column(ARRAY(ARRAY(VARCHAR)))
#     AnalogChannelNames = Column(ARRAY(ARRAY(VARCHAR)))
#     DigitalChannelNames = Column(ARRAY(ARRAY(VARCHAR)))
#     Frequency = Column(ARRAY(Float))
#     ROCOF = Column(ARRAY(Float))
#     PhasorNumber = Column(ARRAY(Integer))
#     PhasorsType = Column(ARRAY(VARCHAR))
#     Phasors = Column(ARRAY(ARRAY(PhasorType)))
#     AnalogNumber = Column(ARRAY(Integer))
#     Analogs = Column(ARRAY(ARRAY(Float)))
#     DigitalNumber = Column(ARRAY(Integer))
#     Digitals = Column(ARRAY(ARRAY(Float)))
#     DataError = Column(ARRAY(VARCHAR))
#     TimeQuality = Column(ARRAY(VARCHAR))
#     PMUSync = Column(ARRAY(Boolean))
#     TriggerReason = Column(VARCHAR)

# # Oscillatory Events
# class OscillatoryEvent(Base):
#     __tablename__ = "oscillatory_events"

#     Identifier = Column(VARCHAR(128))
#     StationName = Column(VARCHAR(128))
#     Frequency = Column(ARRAY(Float))
#     Power = Column(ARRAY(Float))
#     fftFrequency = Column(ARRAY(Float))
#     Time = Column(ARRAY(TIMESTAMP))
#     Threshold = Column(Float)

# # Islanding Events
# class IslandingEvent(Base):
#     __tablename__ = "islanding_events"

#     Identifier = Column(VARCHAR(128))
#     StationsCount = Column(Integer)
#     StationNames = Column(ARRAY(VARCHAR(128)))
#     Frequency = Column(ARRAY(ARRAY(Float)))
#     Time = Column(ARRAY(TIMESTAMP))
#     Threshold = Column(Float)

# # Generator Loss Events
# class GenLossEvent(Base):
#     __tablename__ = "genloss_events"

#     Identifier = Column(VARCHAR(128))
#     StationName = Column(VARCHAR(128))
#     Frequency = Column(ARRAY(Float))
#     Time = Column(ARRAY(TIMESTAMP))
#     Threshold = Column(Float)

# # Load Loss Events
# class LoadLossEvent(Base):
#     __tablename__ = "loadloss_events"

#     Identifier = Column(VARCHAR(128))
#     StationName = Column(VARCHAR(128))
#     Frequency = Column(ARRAY(Float))
#     Time = Column(ARRAY(TIMESTAMP))
#     Threshold = Column(Float)

# # Impulse Events
# class ImpulseEvent(Base):
#     __tablename__ = "impulse_events"

#     Identifier = Column(VARCHAR(128))
#     StationName = Column(VARCHAR(128))
#     Frequency = Column(ARRAY(Float))
#     ROCOF = Column(ARRAY(Float))
#     Time = Column(ARRAY(TIMESTAMP))
#     Threshold = Column(Float)

# Base.metadata.create_all(bind=engine)