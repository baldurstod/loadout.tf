package main

import (
	"context"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/mongo/mongodriver"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	assets "loadout.tf"
)

func startServer(config Config) {
	/*
		store = initStore(&config.Sessions)
		if store == nil {
			log.Fatal("Can't init session store")
		}*/

	engine := initEngine(config)
	var err error

	log.Printf("Listening on port %d\n", config.Port)
	err = engine.RunTLS(":"+strconv.Itoa(config.Port), config.HttpsCertFile, config.HttpsKeyFile)
	log.Fatal(err)
}

func initEngine(config Config) *gin.Engine {
	if ReleaseMode == "true" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.SetTrustedProxies(nil)

	r.Use(cors.New(cors.Config{
		AllowMethods:    []string{"POST", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Length", "Content-Type", "Request-Id"},
		AllowAllOrigins: true,
		MaxAge:          12 * time.Hour,
	}))

	var useFS fs.FS
	var assetsFs = &assets.Assets

	if ReleaseMode == "true" {
		fsys := fs.FS(assetsFs)
		useFS, _ = fs.Sub(fsys, "build/client")
	} else {
		useFS = os.DirFS("build/client")
	}

	p := config.Patreon
	pm := newPatreonMiddleware(p.ClientID, p.ClientSecret, p.RedirectURL, p.CreatorID, p.CreatorCents)

	// Init sessions store
	mongoOptions := options.Client().ApplyURI(config.Sessions.ConnectURI)
	client, err := mongo.Connect(context.Background(), mongoOptions)
	if err != nil {
		log.Fatal(err)
	}
	c := client.Database(config.Sessions.DBName).Collection(config.Sessions.Collection)
	store := mongodriver.NewStore(c, 86400*30, true, []byte(config.Sessions.Secret))

	r.Use(sessions.Sessions(config.Sessions.SessionName, store))
	r.Use(pm.middleware(r))
	r.Use(rewriteURL(r))
	//r.Use(setHeaders())
	r.StaticFS("/static", http.FS(useFS))

	return r
}

func rewriteURL(r *gin.Engine) gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/@") {
			c.Request.URL.Path = "/"
			c.Request.URL.RawPath = "/"
			r.HandleContext(c)
			c.Next()
			return
		}
		if !strings.HasPrefix(c.Request.URL.Path, "/static") {
			c.Request.URL.Path = "/static" + c.Request.URL.Path
			c.Request.URL.RawPath = "/static" + c.Request.URL.Path
			r.HandleContext(c)
			c.Next()
			return
		}
		c.Next()
	}
}

func setHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		c.Writer.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		c.Next()
	}
}
