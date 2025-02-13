# Telegram test backend API

English | [Русский](https://github.com/volveezz/telegram-test-app/blob/master/README_ru.md)

## Overview

This repository provides a test Telegram Node.js API that allows you to authorize in the application using a QR code and send messages with attachments to any user or chat.

## Contents

-  [Requirements](#requirements)
-  [Installation](#installation)
   -  [Repository Cloning](#repository-cloning)
-  [Configuration](#configuration)
-  [Usage](#usage)
-  [API Documentation](#api-documentation)

## Requirements

-  **Node.js** - Make sure Node.js is installed.
-  **Yarn** - This package manager is recommended.

## Installation

### Repository Cloning

Clone the repository and navigate to its directory:

```bash
git clone https://github.com/volveezz/telegram-test-app.git
cd telegram-test-app
```

## Configuration

Create configuration file:

-  Rename `.env.example` to `.env` or create new one
-  Specify the following variables:
   ```
      TELEGRAM_API_ID=YOUR_API_ID     # Get from my.telegram.org/auth after creating app
      TELEGRAM_API_HASH=YOUR_API_HASH # Get from the same page after app creation
   ```

## Usage

To run the project, enter:

```bash
yarn install && yarn start:dev
```
