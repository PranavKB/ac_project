package com.cdac.carpooling.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:noreply@carpooling.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    public void sendRegistrationLinkEmail(String toEmail, String token) {
        try {
            String registerLink = frontendUrl + "/register?token=" + token + "&email=" + toEmail;

            Context context = new Context();
            context.setVariable("email", toEmail);
            context.setVariable("registerLink", registerLink);

            String htmlContent = templateEngine.process("mail/register-link-email", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Complete Your Registration - Carpooling");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Registration link email sent successfully to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send registration link email to {}", toEmail, e);
            throw new RuntimeException("Error sending registration link email: " + e.getMessage(), e);
        }
    }

    @Async
    public void sendRegistrationSuccessEmail(String toEmail, String userName) {
        try {
            String loginLink = frontendUrl + "/login";

            Context context = new Context();
            context.setVariable("name", userName != null ? userName : "User");
            context.setVariable("email", toEmail);
            context.setVariable("loginLink", loginLink);

            String htmlContent = templateEngine.process("mail/registered-successfully-email", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Registered Successfully - Carpooling");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Registration success email sent successfully to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send registration success email to {}", toEmail, e);
        }
    }
}
