pipeline {
  agent any

  tools {
    nodejs 'nodejs'
  }

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

    stage('Unit Tests') {
      steps {
        script {
          runCommand('npm run test:unit')
        }
      }
    }

    stage('Integration Tests') {
      steps {
        script {
          runCommand('npm run test:integration')
        }
      }
    }

    stage('Generate Report') {
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
