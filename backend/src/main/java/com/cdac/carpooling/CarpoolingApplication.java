package com.cdac.carpooling;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CarpoolingApplication {

	public static void main(String[] args) {
		SpringApplication.run(CarpoolingApplication.class, args);
	}

}
