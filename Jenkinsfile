pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        script {
          runCommand('npm ci')
        }
      }
    }

    stage('Test') {
      steps {
        script {
          runCommand('npm run test:ci')
        }
      }
    }

    stage('Report') {
      steps {
        junit allowEmptyResults: true, testResults: 'reports/junit/*.xml'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/junit/*.xml', allowEmptyArchive: true
    }
  }
}

def runCommand(String command) {
  if (isUnix()) {
    sh command
  } else {
    bat command
  }
}
