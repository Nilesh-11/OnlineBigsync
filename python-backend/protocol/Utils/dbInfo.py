init_query = '''
DO $$ 
DECLARE
    type_exists BOOLEAN;
    type_matches BOOLEAN;
BEGIN
    -- Helper function to check and create/update types
    -- phasor_unit_type
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phasor_unit_type') INTO type_exists;

    IF NOT type_exists THEN
        CREATE TYPE phasor_unit_type AS (
            scale FLOAT,
            phasor_type VARCHAR(1)
        );
        RAISE NOTICE 'Type phasor_unit_type created.';
    ELSE
        SELECT NOT EXISTS (
            SELECT 1
            FROM pg_attribute
            WHERE attrelid = 'phasor_unit_type'::regclass
            AND (attname = 'scale' AND atttypid != 'float8'::regtype OR
                 attname = 'phasor_type' AND atttypid != 'varchar'::regtype)
        ) INTO type_matches;

        IF NOT type_matches THEN
            DROP TYPE phasor_unit_type CASCADE;
            RAISE NOTICE 'Type phasor_unit_type structure differs. Dropping and recreating.';
            CREATE TYPE phasor_unit_type AS (
                scale FLOAT,
                phasor_type VARCHAR(1)
            );
            RAISE NOTICE 'Type phasor_unit_type recreated.';
        ELSE
            RAISE NOTICE 'Type phasor_unit_type already exists and matches the structure.';
        END IF;
    END IF;

    -- analog_unit_type
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analog_unit_type') INTO type_exists;

    IF NOT type_exists THEN
        CREATE TYPE analog_unit_type AS (
            scale INTEGER,
            analog_type VARCHAR(10)
        );
        RAISE NOTICE 'Type analog_unit_type created.';
    ELSE
        SELECT NOT EXISTS (
            SELECT 1
            FROM pg_attribute
            WHERE attrelid = 'analog_unit_type'::regclass
            AND (attname = 'scale' AND atttypid != 'int4'::regtype OR
                 attname = 'analog_type' AND atttypid != 'varchar'::regtype)
        ) INTO type_matches;

        IF NOT type_matches THEN
            DROP TYPE analog_unit_type CASCADE;
            RAISE NOTICE 'Type analog_unit_type structure differs. Dropping and recreating.';
            CREATE TYPE analog_unit_type AS (
                scale INTEGER,
                analog_type VARCHAR(10)
            );
            RAISE NOTICE 'Type analog_unit_type recreated.';
        ELSE
            RAISE NOTICE 'Type analog_unit_type already exists and matches the structure.';
        END IF;
    END IF;

    -- digital_unit_type
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'digital_unit_type') INTO type_exists;

    IF NOT type_exists THEN
        CREATE TYPE digital_unit_type AS (
            word1 VARCHAR(16),
            word2 VARCHAR(16)
        );
        RAISE NOTICE 'Type digital_unit_type created.';
    ELSE
        SELECT NOT EXISTS (
            SELECT 1
            FROM pg_attribute
            WHERE attrelid = 'digital_unit_type'::regclass
            AND (attname = 'word1' AND atttypid != 'varchar'::regtype OR
                 attname = 'word2' AND atttypid != 'varchar'::regtype)
        ) INTO type_matches;

        IF NOT type_matches THEN
            DROP TYPE digital_unit_type CASCADE;
            RAISE NOTICE 'Type digital_unit_type structure differs. Dropping and recreating.';
            CREATE TYPE digital_unit_type AS (
                word1 VARCHAR(16),
                word2 VARCHAR(16)
            );
            RAISE NOTICE 'Type digital_unit_type recreated.';
        ELSE
            RAISE NOTICE 'Type digital_unit_type already exists and matches the structure.';
        END IF;
    END IF;

    -- phasor_type
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phasor_type') INTO type_exists;

    IF NOT type_exists THEN
        CREATE TYPE phasor_type AS (
            part1 FLOAT,
            part2 FLOAT
        );
        RAISE NOTICE 'Type phasor_type created.';
    ELSE
        SELECT NOT EXISTS (
            SELECT 1
            FROM pg_attribute
            WHERE attrelid = 'phasor_type'::regclass
            AND (attname = 'part1' AND atttypid != 'float8'::regtype OR
                 attname = 'part2' AND atttypid != 'float8'::regtype)
        ) INTO type_matches;

        IF NOT type_matches THEN
            DROP TYPE phasor_type CASCADE;
            RAISE NOTICE 'Type phasor_type structure differs. Dropping and recreating.';
            CREATE TYPE phasor_type AS (
                part1 FLOAT,
                part2 FLOAT
            );
            RAISE NOTICE 'Type phasor_type recreated.';
        ELSE
            RAISE NOTICE 'Type phasor_type already exists and matches the structure.';
        END IF;
    END IF;
END $$;
'''

config_table_name = "configuration_frames"
config_table_details = '''
time timestamp,
Identifier VARCHAR(128),
FrameVersion INT,
StreamID INT,
DataRate INT,
NumberOfPMU INT,
StationName VARCHAR[],
DataID INT[],
PhasorNumber INT[],
PhasorUnit phasor_unit_type[],
AnalogNumber INT[],
AnalogUnit analog_unit_type[],
DigitalNumber INT[],
DigitalUnit digital_unit_type[],
PhasorChannelNames VARCHAR[][],
AnalogChannelNames VARCHAR[][],
DigitalChannelNames VARCHAR[][],
NominalFrequency INT[],
ConfigurationChangeCount INT[]
'''

data_table_name = "data_frames"
data_table_details = '''
time timestamp PRIMARY KEY,
Identifier VARCHAR(128),
NumberOfPMU INT,
StreamID INT,
StationName VARCHAR[],
DataID INT[],
PhasorChannelNames VARCHAR[][],
AnalogChannelNames VARCHAR[][],
DigitalChannelNames VARCHAR[][],
Frequency FLOAT[],
ROCOF FLOAT[],
PhasorNumber INT[],
PhasorsType VARCHAR[],
Phasors phasor_type[][],
AnalogNumber INT[],
Analogs FLOAT[][],
DigitalNumber INT[],
Digitals FLOAT[][],
DataError VARCHAR[],
TimeQuality VARCHAR[],
PMUSync BOOLEAN[],
TriggerReason VARCHAR
'''

oscillatory_events_table_name = "oscillatory_events"
oscillatory_events_table_details = '''
Identifier VARCHAR(128),
StationName VARCHAR(128),
Frequency FLOAT[],
Power FLOAT[],
fftFrequency FLOAT[],
Time timestamp[],
Threshold FLOAT
'''

islanding_events_table_name = "islanding_events"
islanding_events_table_details = '''
Identifier VARCHAR(128),
StationsCount INT,
StationNames VARCHAR(128)[],
Frequency FLOAT[][],
Time timestamp[],
Threshold FLOAT
'''

genLoss_events_table_name = "genloss_events"
genLoss_events_table_details = '''
Identifier VARCHAR(128),
StationName VARCHAR(128),
Frequency FLOAT[],
Time timestamp[],
Threshold FLOAT
'''

loadLoss_events_table_name = "loadloss_events"
loadLoss_events_table_details = '''
Identifier VARCHAR(128),
StationName VARCHAR(128),
Frequency FLOAT[],
Time timestamp[],
Threshold FLOAT
'''

impulse_events_table_name = "impulse_events"
impulse_events_table_details = '''
Identifier VARCHAR(128),
StationName VARCHAR(128),
Frequency FLOAT[],
ROCOF FLOAT[],
Time timestamp[],
Threshold FLOAT
'''