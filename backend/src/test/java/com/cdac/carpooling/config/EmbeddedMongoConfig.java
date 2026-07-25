package com.cdac.carpooling.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.mongo.transitions.Mongod;
import de.flapdoodle.embed.mongo.transitions.RunningMongodProcess;
import de.flapdoodle.embed.process.runtime.Network;
import de.flapdoodle.reverse.TransitionWalker;
import de.flapdoodle.reverse.transitions.Start;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.UnknownHostException;

@Configuration
@Profile("test")
public class EmbeddedMongoConfig {

    private final int port;
    private final TransitionWalker.ReachedState<RunningMongodProcess> process;

    public EmbeddedMongoConfig() {
        try {
            this.port = findFreePort();
            Mongod mongod = Mongod.builder()
                    .net(Start.to(Net.class).providedBy(() -> {
                        try {
                            return Net.of("localhost", port, Network.localhostIsIPv6());
                        } catch (UnknownHostException e) {
                            throw new RuntimeException(e);
                        }
                    }))
                    .build();
            this.process = mongod.start(Version.Main.PRODUCTION);
        } catch (Exception e) {
            throw new RuntimeException("Failed to start Embedded MongoDB", e);
        }
    }

    @Bean
    @Primary
    public MongoClient mongoClient() {
        return MongoClients.create("mongodb://localhost:" + port);
    }

    @Bean
    @Primary
    public MongoDatabaseFactory mongoDatabaseFactory(MongoClient mongoClient) {
        return new SimpleMongoClientDatabaseFactory(mongoClient, "test");
    }

    @Bean
    @Primary
    public MongoTemplate mongoTemplate(MongoDatabaseFactory factory) {
        return new MongoTemplate(factory);
    }

    @jakarta.annotation.PreDestroy
    public void stop() {
        if (process != null) {
            process.close();
        }
    }

    private static int findFreePort() {
        try (ServerSocket socket = new ServerSocket(0)) {
            socket.setReuseAddress(true);
            return socket.getLocalPort();
        } catch (IOException e) {
            throw new RuntimeException("Could not find a free port for Embedded MongoDB", e);
        }
    }
}
