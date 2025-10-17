package main

import (
	"log"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func getSession(c *gin.Context) sessions.Session {
	session := sessions.Default(c)
	session.Options(sessions.Options{MaxAge: 86400 * 30, Path: "/"})
	return session
}

func saveSession(s sessions.Session) error {
	err := s.Save()
	if err != nil {
		log.Println("Error while saving session: ", err)
	}
	return nil
}
