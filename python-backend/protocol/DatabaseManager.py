import time
import psycopg2
from psycopg2 import sql, DatabaseError
from contextlib import contextmanager

import psycopg2.pool
from protocol.Utils.utils import *
from protocol.Utils.dbInfo import *

class DatabaseManager:
    def __init__(self, dbname, user, password, host='localhost', port='5432'):
        """Initialize the database manager with connection parameters."""
        self.row_limit = 5
        self.dbname = dbname
        self.user = user
        self.password = password
        self.host = host
        self.port = port
        self.init_query = init_query
        
        self.data_column_names = [name.lower() for name in parse_column_detail(data_table_details)]
        self.config_column_names = [name.lower() for name in parse_column_detail(config_table_details)]
        
        self.impulseEvents_column_names = [name.lower() for name in parse_column_detail(impulse_events_table_details)]
        self.oscillatoryEvents_column_names = [name.lower() for name in parse_column_detail(oscillatory_events_table_details)]
        self.islandingEvents_column_names = [name.lower() for name in parse_column_detail(islanding_events_table_details)]
        self.loadLossEvents_column_names = [name.lower() for name in parse_column_detail(loadLoss_events_table_details)]
        self.genLossEvents_column_names = [name.lower() for name in parse_column_detail(genLoss_events_table_details)]

        self.connection_pool = psycopg2.pool.SimpleConnectionPool( minconn=5, maxconn=30, 
                                                                    dbname=self.dbname,
                                                                    user=self.user,
                                                                    password=self.password,
                                                                    host=self.host,
                                                                    port=self.port
                                                                )

    def run(self):
        # self.execute_query(self.init_query)
        
        self.create_table(config_table_name, self.config_column_names, config_table_details)
        self.create_table(data_table_name, self.data_column_names, data_table_details)
        self.create_table(oscillatory_events_table_name, self.oscillatoryEvents_column_names, oscillatory_events_table_details)
        self.create_table(impulse_events_table_name, self.impulseEvents_column_names, impulse_events_table_details)
        self.create_table(genLoss_events_table_name, self.genLossEvents_column_names, genLoss_events_table_details)
        self.create_table(loadLoss_events_table_name, self.loadLossEvents_column_names, loadLoss_events_table_details)
        self.create_table(islanding_events_table_name, self.islandingEvents_column_names, islanding_events_table_details)
        
        time.sleep(1)

    def _connect(self):
        """Private method to establish a database connection."""
        try:
            connection = self.connection_pool.getconn()
            return connection
        except DatabaseError as e:
            print(f"Error while connecting to database: {e}")
            raise

    @contextmanager
    def get_cursor(self):
        """Context manager for handling database cursor.

        Yields:
            _type_: cursor to the row in table
        """
        connection = None
        cursor = None
        try:
            connection = self._connect()
            cursor = connection.cursor()
            yield cursor  # Provide cursor to the caller
            connection.commit()  # Commit changes after operations
        except Exception as e:
            if connection:
                connection.rollback()  # Rollback on error
            print(f"Error executing database operation: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if connection:
                self.connection_pool.putconn(connection)  # Return the connection to the pool

    def execute_query(self, query, params=None):
        """Execute a simple query like INSERT, UPDATE, or DELETE."""
        with self.get_cursor() as cursor:
            cursor.execute(query, params)

    def fetch_all(self, query, params=None):
        """Execute a SELECT query and return all rows."""
        with self.get_cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    def fetch_one(self, query, params=None):
        """Execute a SELECT query and return a single row."""
        with self.get_cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
    
    def create_table(self, table_name, column_names, column_details):
        """
        Creates a new table in PostgreSQL if it doesn't already exist or if the column details are different.

        Args:
            table_name (string): Name of the table to create (string).
            column_names ([string]): List of column names (list of strings).
            column_details (string): Column definitions (string, e.g., "id SERIAL PRIMARY KEY, name VARCHAR(100)").
        """
        try:
            # Check if the table exists
            check_table_query = f"""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public';
            """
            
            table_exists = True if table_name in [names[0] for names in self.fetch_all(check_table_query)] else False

            if table_exists:
                print(f"Table '{table_name}' already exists. Checking columns...")

                # Check if columns match
                check_columns_query = f"""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}' AND table_schema = 'public';
                """
                existing_column_names = [names[0] for names in self.fetch_all(check_columns_query, (table_name,))]

                # Compare existing columns with new ones
                if existing_column_names == column_names:
                    print(f"Table '{table_name}' already has the same columns.")
                    return
                else:
                    print(f"Table '{table_name}' exists, but columns do not match. Dropping and recreating...")
                    self.execute_query(f"DROP TABLE IF EXISTS {table_name};")
            
            # Create the table if it does not exist or after dropping it
            create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} ({column_details});"
            self.execute_query(create_table_query)
            print(f"Table '{table_name}' created successfully.")
        except Exception as e:
            print(f"Error creating table '{table_name}': {e}")

    def store_frame(self, datas, frame_type):
        """Stores the stack of frames in database

        Args:
            datas ([tuple]): 1D Array of frames
            frame_type ([integer]): 1D Array representing frame type for each frame

        Raises:
            NotImplementedError: for invalid frame type
        """
        for i in range(len(datas)):
            data = datas[i]
            if frame_type[i] == 0:
                tableName = data_table_name
                columnNames = self.data_column_names
            elif frame_type[i] & 2 != 0 or frame_type[i] == 5:
                tableName = config_table_name
                columnNames = self.config_column_names
            else:
                raise NotImplementedError(f"No method to store the frame type {frame_type}.")
            
            assert len(columnNames) == len(datas[i]), f"Number of columns({len(columnNames)}) does not matches with data({len(datas[0])})"

            values = []

            for j in range(len(data)):
                if columnNames[j] == 'phasors':
                    res = format_phasor_type_array(data[j])
                elif columnNames[j] == 'phasorunit':
                    res = format_phasor_unit_type_array(data[j])
                elif columnNames[j] == 'analogunit':
                    res = format_analog_unit_type_array(data[j])
                elif columnNames[j] == 'digitalunit':
                    res = format_digital_unit_type_array(data[j])
                else:
                    res = "\'" + convert_to_postgres_datatype(data[j]) + "\'"
                values.append(res)
            query = f"INSERT INTO {tableName} ({', '.join(columnNames)}) VALUES ({','.join(values)});"
            self.execute_query(query)

    def store_events(self, data, event_type):
        if event_type == 'oscillatory':
            tableName = oscillatory_events_table_name
            columnNames = self.oscillatoryEvents_column_names
        elif event_type == 'impulse':
            tableName = impulse_events_table_name
            columnNames = self.impulseEvents_column_names
        elif event_type == 'genLoss':
            tableName = genLoss_events_table_name
            columnNames = self.genLossEvents_column_names
        elif event_type == 'loadLoss':
            tableName = loadLoss_events_table_name
            columnNames = self.loadLossEvents_column_names
        elif event_type == 'islanding':
            tableName = islanding_events_table_name
            columnNames = self.islandingEvents_column_names
        else:
            raise NotImplementedError(f"Ambigous event type ({event_type})")
        
        assert len(columnNames) == len(data), f"Number of columns({len(columnNames)}) does not matches with data({len(data)})"
        
        values = []
        for j in range(len(data)):
            res = "\'" + convert_to_postgres_datatype(data[j]) + "\'"
            values.append(res)
        query = f"INSERT INTO {tableName} ({', '.join(columnNames)}) VALUES ({','.join(values)});"
        self.execute_query(query)

    def get_max_timestamp(self, frameIdentifier):
        query = f'''
        select max(time)
        from {data_table_name}
        WHERE identifier = \'\"{frameIdentifier}\"\'
        '''
        max_timestamp = self.fetch_all(query)[0][0]
        return max_timestamp
    
    def get_frequency_dataframes(self, frameIdentifier, time_window_len, timestamp):
        query = f'''
        SELECT time, frequency, numberofpmu, stationname
        FROM {data_table_name}
        WHERE identifier = \'\"{frameIdentifier}\"\'
        AND time BETWEEN \'{timestamp}\'::timestamp - INTERVAL '{time_window_len} seconds' AND \'{timestamp}\'::timestamp
        ORDER BY time ASC
        '''
        data = self.fetch_all(query)
        return data