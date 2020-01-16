package de.tum.in.www1.artemis.config.auth;

import java.io.IOException;

import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;

@Component
@Profile("jira")
public class JiraAuthorizationInterceptor implements ClientHttpRequestInterceptor {

    @Value("${artemis.jira.user}")
    private String JIRA_USER;

    @Value("${artemis.jira.password}")
    private String JIRA_PASSWORD;

    @NotNull
    @Override
    public ClientHttpResponse intercept(HttpRequest request, @NotNull byte[] body, ClientHttpRequestExecution execution) throws IOException {
        request.getHeaders().setBasicAuth(JIRA_USER, JIRA_PASSWORD);

        return execution.execute(request, body);
    }
}