package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

var dbs = []*sql.DB{}

func openPostgre(dataSourceName string) *sql.DB {
	var err error
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		log.Fatal(err)
	}

	// db.Open() only creates a connection pool, and doesn't actually establish
	// a connection. To ensure the connection works you need to do *something*
	// with a connection.
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	dbs = append(dbs, db)

	return db
}

func closePostgre() {
	for _, db := range dbs {
		if db != nil {
			db.Close()
		}
	}
}
