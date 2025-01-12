import time
import psycopg2
from psycopg2 import sql, DatabaseError
from contextlib import contextmanager

import psycopg2.pool
from Utils.utils import *
from Utils.dbInfo import *

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
        self.connection_pool = psycopg2.pool.SimpleConnectionPool( minconn=1, maxconn=30, 
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
        """Context manager for handling database cursor."""
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
        - table_name: Name of the table to create (string).
        - column_names: List of column names (list of strings).
        - column_details: Column definitions (string, e.g., "id SERIAL PRIMARY KEY, name VARCHAR(100)").
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
        for i in range(len(datas)):
            data = datas[i]
            if frame_type[i] == 0:
                tableName = data_table_name
                columnNames = self.data_column_names[1:]
            elif frame_type[i] & 2 != 0 or frame_type[i] == 5:
                tableName = config_table_name
                columnNames = self.config_column_names[1:]
            else:
                raise NotImplementedError(f"No method to store the frame type {frame_type}.")
                    
            assert len(columnNames) == len(datas[i]), f"Number of columns({len(columnNames)}) does not matches with data({len(data[0])})"

            values = []
            for i in range(len(data)):
                if columnNames[i] == 'phasors':
                    res = format_phasor_type_array(data[i])
                elif columnNames[i] == 'phasorunit':
                    res = format_phasor_unit_type_array(data[i])
                elif columnNames[i] == 'analogunit':
                    res = format_analog_unit_type_array(data[i])
                elif columnNames[i] == 'digitalunit':
                    res = format_digital_unit_type_array(data[i])
                else:
                    res = f'\'' + convert_to_postgres_datatype(data[i]) + f'\''
                values.append(res)
            
            query = f"INSERT INTO {tableName} ({', '.join(columnNames)}) VALUES ({','.join(values)});"
            self.execute_query(query)
    
    def get_dataframes(self, identifier):
        query = f'''
        SELECT * 
        FROM {data_table_name}
        WHERE identifier = '"{identifier}"'
        ORDER BY soc DESC
        LIMIT {self.row_limit}
        '''
        print(query)
        data = self.fetch_all(query)
        return data