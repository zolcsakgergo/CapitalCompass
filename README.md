# InvestmentTracker

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Environment Setup

Before running the application, you need to set up your environment files:

### Frontend Environment

1. Copy `src/environments/environment.template.ts` to `src/environments/environment.ts`
2. Update the values in `environment.ts` with your actual configuration:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api',
     twelveDataApiKey: 'YOUR_TWELVE_DATA_API_KEY', // Get this from Twelve Data
   };
   ```

### Backend Environment

1. Copy `backend/.env.template` to `backend/.env`
2. Update the values in `.env` with your actual configuration:
   ```
   TWELVE_DATA_API_KEY=your_twelve_data_api_key
   JWT_SECRET=your_secure_jwt_secret_key_here
   ```

**Note:** Never commit the actual environment files (`environment.ts` and `.env`) to version control as they contain sensitive information. Only the template files should be committed.
