// =====================================================================
//  Pipeline DevSecOps - NutriBox API (ISY1102 - Actividad 3.2)
//  Etapas: Checkout -> Build -> Tests+Cobertura -> SCA || SAST
//          -> (Quality Gate SonarQube opcional) -> Imagen Docker
//          -> Deploy Staging -> Smoke Test
//  Política "Broken Build": si una etapa falla, las siguientes NO se
//  ejecutan y el despliegue queda BLOQUEADO.
// =====================================================================
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 30, unit: 'MINUTES')
    }

    // Disparador automático: Jenkins revisa el repositorio cada ~2 minutos
    // y ejecuta el pipeline si detecta un commit nuevo.
    triggers {
        pollSCM('H/2 * * * *')
    }

    parameters {
        booleanParam(
            name: 'EJECUTAR_SONARQUBE',
            defaultValue: false,
            description: 'Ejecutar análisis SonarQube + Quality Gate (requiere la fase opcional configurada)'
        )
    }

    environment {
        IMAGE_NAME     = 'nutribox-api'
        IMAGE_TAG      = "${env.BUILD_NUMBER}"
        STAGING_NAME   = 'nutribox-staging'
        STAGING_PORT   = '8081'
        DOCKER_NETWORK = 'cicd-net'
    }

    stages {

        stage('1. Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --pretty=format:"Commit %h por %an: %s%n"'
                sh 'node --version && npm --version && docker --version'
            }
        }

        stage('2. Build (dependencias)') {
            steps {
                sh 'npm ci --no-audit --no-fund'
                sh 'mkdir -p reports'
            }
        }

        stage('3. Pruebas + Cobertura') {
            steps {
                // Si un test falla o la cobertura baja de 80% => el build se rompe aquí
                sh 'npm run test:ci'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'reports/junit.xml'
                    recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'coverage/cobertura-coverage.xml']])
                }
            }
        }

        stage('4. Seguridad') {
            // Sin failFast: ambos análisis se ejecutan siempre para ver los 2 reportes,
            // pero si cualquiera falla, la etapa falla y el despliegue se bloquea.
            parallel {
                stage('SCA - npm audit') {
                    steps {
                        sh 'npm audit --json > reports/npm-audit.json || true'
                        // Gate: rompe el build si hay vulnerabilidades ALTAS o CRÍTICAS
                        // en las dependencias que llegan a producción (--omit=dev)
                        sh 'npm run audit:gate'
                    }
                }
                stage('SAST - ESLint Security') {
                    steps {
                        sh 'npx eslint . -f html -o reports/sast-eslint.html || true'
                        // Gate: rompe el build si hay patrones inseguros (eval, child_process, ReDoS...)
                        sh 'npm run lint'
                    }
                }
            }
        }

        stage('5. Quality Gate SonarQube (opcional)') {
            when {
                expression { return params.EJECUTAR_SONARQUBE }
            }
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('6. Build imagen Docker') {
            steps {
                // Falla con un mensaje claro si Jenkins no puede usar Docker
                // o si la red creada por la infraestructura no existe.
                sh 'docker info > /dev/null'
                sh 'docker network inspect ${DOCKER_NETWORK} > /dev/null'
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest .'
                sh 'docker image inspect ${IMAGE_NAME}:${IMAGE_TAG} --format="Imagen creada: {{.Id}}"'
            }
        }

        stage('7. Deploy a Staging') {
            steps {
                sh '''
                    docker rm -f ${STAGING_NAME} 2>/dev/null || true
                    docker run -d \
                        --name ${STAGING_NAME} \
                        --network ${DOCKER_NETWORK} \
                        -p ${STAGING_PORT}:3000 \
                        --restart unless-stopped \
                        --label laboratorio=nutribox-cicd \
                        ${IMAGE_NAME}:${IMAGE_TAG}

                    # Confirma inmediatamente que Docker no rechazó el arranque.
                    test "$(docker inspect -f '{{.State.Running}}' ${STAGING_NAME})" = "true"
                    docker ps --filter "name=^/${STAGING_NAME}$"
                '''
            }
        }

        stage('8. Smoke Test') {
            steps {
                sh '''
                    # Jenkins comparte cicd-net con staging. El nombre del contenedor
                    # funciona como nombre DNS dentro de esa red.
                    intentos=0
                    until curl -fsS "http://${STAGING_NAME}:3000/health"; do
                        intentos=$((intentos + 1))
                        if [ "$intentos" -ge 15 ]; then
                            echo "ERROR: la API no respondió después de 30 segundos."
                            echo "Estado del contenedor:"
                            docker inspect ${STAGING_NAME} --format 'status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}sin-healthcheck{{end}} exit={{.State.ExitCode}}'
                            echo "Últimas líneas del log:"
                            docker logs --tail 100 ${STAGING_NAME}
                            exit 1
                        fi
                        echo "API iniciando... intento ${intentos}/15"
                        sleep 2
                    done
                    echo
                    curl -fsS "http://${STAGING_NAME}:3000/api/productos" > /dev/null
                '''
                echo "Aplicación disponible en http://localhost:${STAGING_PORT}/health"
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/**, coverage/cobertura-coverage.xml', allowEmptyArchive: true
        }
        success {
            echo "PIPELINE OK: build #${env.BUILD_NUMBER} desplegado en staging (imagen ${IMAGE_NAME}:${IMAGE_TAG})."
        }
        failure {
            echo "PIPELINE FALLIDO: build #${env.BUILD_NUMBER} BLOQUEADO. Revisa la etapa en rojo; NO se desplegó a staging."
            sh 'docker ps -a --filter "name=^/${STAGING_NAME}$" || true'
            sh 'docker logs --tail 100 ${STAGING_NAME} 2>/dev/null || true'
        }
    }
}
