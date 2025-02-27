# Puppeteer 공식 이미지 사용 (최신 버전)
FROM ghcr.io/puppeteer/puppeteer:23.8.0

# 컨테이너 작업 디렉토리 설정
WORKDIR /usr/src/app

# 사용자 권한 설정
USER root

# 애플리케이션 의존성 복사
COPY package.json package-lock.json ./

# 권한 수정 (보안 강화)
RUN chown -R pptruser:pptruser /usr/src/app

# 비-루트 사용자로 전환 (보안 강화)
USER pptruser

# 의존성 설치
RUN npm install --omit=dev

# 애플리케이션 코드 복사
COPY . .

# Express 서버 포트 설정
EXPOSE 80

# 실행 명령어 (Express 서버 실행)
CMD ["npm", "start"]