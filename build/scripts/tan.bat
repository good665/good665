@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem
@rem SPDX-License-Identifier: Apache-2.0
@rem

@if "%DEBUG%"=="" @echo off
@rem ##########################################################################
@rem
@rem  tan startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
@rem This is normally unused
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%..

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and TAN_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS=

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\lib\tan-0.0.1-SNAPSHOT-plain.jar;%APP_HOME%\lib\spring-boot-docker-compose-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-batch-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-jdbc-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-thymeleaf-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-data-redis-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-amqp-3.3.3.jar;%APP_HOME%\lib\spring-cloud-starter-gateway-4.1.4.jar;%APP_HOME%\lib\spring-cloud-gateway-server-4.1.4.jar;%APP_HOME%\lib\spring-boot-starter-validation-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-actuator-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-artemis-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-webflux-3.3.3.jar;%APP_HOME%\lib\spring-boot-starter-json-3.3.3.jar;%APP_HOME%\lib\spring-cloud-starter-circuitbreaker-reactor-resilience4j-3.1.1.jar;%APP_HOME%\lib\h2-2.2.224.jar;%APP_HOME%\lib\artemis-jakarta-server-2.33.0.jar;%APP_HOME%\lib\hsqldb-2.7.3.jar;%APP_HOME%\lib\jackson-datatype-jdk8-2.17.2.jar;%APP_HOME%\lib\spring-boot-actuator-autoconfigure-3.3.3.jar;%APP_HOME%\lib\jackson-datatype-jsr310-2.17.2.jar;%APP_HOME%\lib\jackson-annotations-2.17.2.jar;%APP_HOME%\lib\jackson-core-2.17.2.jar;%APP_HOME%\lib\jackson-module-parameter-names-2.17.2.jar;%APP_HOME%\lib\jackson-databind-2.17.2.jar;%APP_HOME%\lib\spring-cloud-starter-4.1.3.jar;%APP_HOME%\lib\spring-boot-starter-3.3.3.jar;%APP_HOME%\lib\spring-boot-autoconfigure-3.3.3.jar;%APP_HOME%\lib\spring-boot-actuator-3.3.3.jar;%APP_HOME%\lib\spring-boot-3.3.3.jar;%APP_HOME%\lib\HikariCP-5.1.0.jar;%APP_HOME%\lib\spring-batch-core-5.1.2.jar;%APP_HOME%\lib\spring-jdbc-6.1.12.jar;%APP_HOME%\lib\thymeleaf-spring6-3.1.2.RELEASE.jar;%APP_HOME%\lib\lettuce-core-6.3.2.RELEASE.jar;%APP_HOME%\lib\spring-data-redis-3.3.3.jar;%APP_HOME%\lib\spring-rabbit-3.1.7.jar;%APP_HOME%\lib\spring-jms-6.1.12.jar;%APP_HOME%\lib\spring-messaging-6.1.12.jar;%APP_HOME%\lib\tomcat-embed-el-10.1.28.jar;%APP_HOME%\lib\hibernate-validator-8.0.1.Final.jar;%APP_HOME%\lib\micrometer-jakarta9-1.13.3.jar;%APP_HOME%\lib\spring-webflux-6.1.12.jar;%APP_HOME%\lib\spring-web-6.1.12.jar;%APP_HOME%\lib\spring-cloud-circuitbreaker-resilience4j-3.1.1.jar;%APP_HOME%\lib\spring-data-keyvalue-3.3.3.jar;%APP_HOME%\lib\spring-context-support-6.1.12.jar;%APP_HOME%\lib\spring-context-6.1.12.jar;%APP_HOME%\lib\artemis-server-2.33.0.jar;%APP_HOME%\lib\resilience4j-spring-boot3-2.1.0.jar;%APP_HOME%\lib\resilience4j-micrometer-2.1.0.jar;%APP_HOME%\lib\micrometer-core-1.13.3.jar;%APP_HOME%\lib\micrometer-observation-1.13.3.jar;%APP_HOME%\lib\artemis-jakarta-service-extensions-2.33.0.jar;%APP_HOME%\lib\artemis-jakarta-client-2.33.0.jar;%APP_HOME%\lib\resilience4j-reactor-2.1.0.jar;%APP_HOME%\lib\resilience4j-spring6-2.1.0.jar;%APP_HOME%\lib\resilience4j-framework-common-2.1.0.jar;%APP_HOME%\lib\resilience4j-circuitbreaker-2.1.0.jar;%APP_HOME%\lib\resilience4j-timelimiter-2.1.0.jar;%APP_HOME%\lib\artemis-jdbc-store-2.33.0.jar;%APP_HOME%\lib\artemis-core-client-2.33.0.jar;%APP_HOME%\lib\artemis-journal-2.33.0.jar;%APP_HOME%\lib\artemis-selector-2.33.0.jar;%APP_HOME%\lib\artemis-commons-2.33.0.jar;%APP_HOME%\lib\thymeleaf-3.1.2.RELEASE.jar;%APP_HOME%\lib\amqp-client-5.21.0.jar;%APP_HOME%\lib\resilience4j-ratelimiter-2.1.0.jar;%APP_HOME%\lib\resilience4j-bulkhead-2.1.0.jar;%APP_HOME%\lib\resilience4j-retry-2.1.0.jar;%APP_HOME%\lib\resilience4j-consumer-2.1.0.jar;%APP_HOME%\lib\resilience4j-core-2.1.0.jar;%APP_HOME%\lib\spring-boot-starter-logging-3.3.3.jar;%APP_HOME%\lib\logback-classic-1.5.7.jar;%APP_HOME%\lib\log4j-to-slf4j-2.23.1.jar;%APP_HOME%\lib\jul-to-slf4j-2.0.16.jar;%APP_HOME%\lib\spring-data-commons-3.3.3.jar;%APP_HOME%\lib\resilience4j-annotations-2.1.0.jar;%APP_HOME%\lib\resilience4j-circularbuffer-2.1.0.jar;%APP_HOME%\lib\slf4j-api-2.0.16.jar;%APP_HOME%\lib\jakarta.jms-api-3.1.0.jar;%APP_HOME%\lib\commons-dbcp2-2.12.0.jar;%APP_HOME%\lib\jakarta.transaction-api-2.0.1.jar;%APP_HOME%\lib\spring-tx-6.1.12.jar;%APP_HOME%\lib\spring-oxm-6.1.12.jar;%APP_HOME%\lib\spring-aop-6.1.12.jar;%APP_HOME%\lib\spring-beans-6.1.12.jar;%APP_HOME%\lib\spring-amqp-3.1.7.jar;%APP_HOME%\lib\spring-batch-infrastructure-5.1.2.jar;%APP_HOME%\lib\spring-expression-6.1.12.jar;%APP_HOME%\lib\spring-core-6.1.12.jar;%APP_HOME%\lib\jakarta.annotation-api-2.1.1.jar;%APP_HOME%\lib\snakeyaml-2.2.jar;%APP_HOME%\lib\spring-boot-starter-reactor-netty-3.3.3.jar;%APP_HOME%\lib\reactor-netty-http-1.1.22.jar;%APP_HOME%\lib\reactor-netty-core-1.1.22.jar;%APP_HOME%\lib\netty-handler-proxy-4.1.112.Final.jar;%APP_HOME%\lib\netty-codec-http2-4.1.112.Final.jar;%APP_HOME%\lib\netty-codec-http-4.1.112.Final.jar;%APP_HOME%\lib\netty-resolver-dns-native-macos-4.1.112.Final-osx-x86_64.jar;%APP_HOME%\lib\netty-resolver-dns-classes-macos-4.1.112.Final.jar;%APP_HOME%\lib\netty-resolver-dns-4.1.112.Final.jar;%APP_HOME%\lib\netty-handler-4.1.112.Final.jar;%APP_HOME%\lib\netty-transport-native-epoll-4.1.112.Final-linux-x86_64.jar;%APP_HOME%\lib\netty-transport-classes-epoll-4.1.112.Final.jar;%APP_HOME%\lib\netty-transport-native-kqueue-4.1.112.Final-osx-x86_64.jar;%APP_HOME%\lib\netty-transport-classes-kqueue-4.1.112.Final.jar;%APP_HOME%\lib\netty-codec-socks-4.1.112.Final.jar;%APP_HOME%\lib\netty-codec-dns-4.1.112.Final.jar;%APP_HOME%\lib\netty-codec-4.1.112.Final.jar;%APP_HOME%\lib\netty-transport-native-unix-common-4.1.112.Final.jar;%APP_HOME%\lib\netty-transport-4.1.112.Final.jar;%APP_HOME%\lib\netty-buffer-4.1.112.Final.jar;%APP_HOME%\lib\netty-resolver-4.1.112.Final.jar;%APP_HOME%\lib\netty-common-4.1.112.Final.jar;%APP_HOME%\lib\reactor-extra-3.5.2.jar;%APP_HOME%\lib\reactor-core-3.6.9.jar;%APP_HOME%\lib\jakarta.validation-api-3.0.2.jar;%APP_HOME%\lib\jboss-logging-3.5.3.Final.jar;%APP_HOME%\lib\classmate-1.7.0.jar;%APP_HOME%\lib\micrometer-commons-1.13.3.jar;%APP_HOME%\lib\spring-cloud-context-4.1.3.jar;%APP_HOME%\lib\spring-cloud-commons-4.1.3.jar;%APP_HOME%\lib\spring-security-rsa-1.1.3.jar;%APP_HOME%\lib\jgroups-5.3.2.Final.jar;%APP_HOME%\lib\pem-keystore-2.3.0.jar;%APP_HOME%\lib\bcpkix-jdk18on-1.77.jar;%APP_HOME%\lib\bcutil-jdk18on-1.77.jar;%APP_HOME%\lib\bcprov-jdk18on-1.78.jar;%APP_HOME%\lib\caffeine-3.1.8.jar;%APP_HOME%\lib\artemis-lockmanager-api-2.33.0.jar;%APP_HOME%\lib\jctools-core-4.0.2.jar;%APP_HOME%\lib\commons-beanutils-1.9.4.jar;%APP_HOME%\lib\commons-configuration2-2.9.0.jar;%APP_HOME%\lib\commons-text-1.10.0.jar;%APP_HOME%\lib\commons-lang3-3.14.0.jar;%APP_HOME%\lib\commons-collections-3.2.2.jar;%APP_HOME%\lib\activemq-artemis-native-2.0.0.jar;%APP_HOME%\lib\spring-jcl-6.1.12.jar;%APP_HOME%\lib\attoparser-2.0.7.RELEASE.jar;%APP_HOME%\lib\unbescape-1.1.6.RELEASE.jar;%APP_HOME%\lib\reactive-streams-1.0.4.jar;%APP_HOME%\lib\jakarta.xml.bind-api-4.0.2.jar;%APP_HOME%\lib\spring-retry-2.0.8.jar;%APP_HOME%\lib\spring-security-crypto-6.3.3.jar;%APP_HOME%\lib\commons-logging-1.3.0.jar;%APP_HOME%\lib\logback-core-1.5.7.jar;%APP_HOME%\lib\log4j-api-2.23.1.jar;%APP_HOME%\lib\jakarta.activation-api-2.1.3.jar;%APP_HOME%\lib\commons-pool2-2.12.0.jar


@rem Execute tan
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %TAN_OPTS%  -classpath "%CLASSPATH%" com.tansong.controller %*

:end
@rem End local scope for the variables with windows NT shell
if %ERRORLEVEL% equ 0 goto mainEnd

:fail
rem Set variable TAN_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
if not ""=="%TAN_EXIT_CONSOLE%" exit %EXIT_CODE%
exit /b %EXIT_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
