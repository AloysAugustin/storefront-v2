# Scalr Storefront v2

The Scalr storefront is a simple interface to Scalr that allows to quickly launch Farms in Scalr using the APIv2.

## Usage

The use of the storefront is purposefully as simple as possible. Login with Scalr by clicking the login button. Then, to launch an application, head to the "Catalog" tab, click ont the application you need, choose what settings you want or just keep the defaults, and click on "Launch". Your application will appear in the "My Applications" tab.

## Setup instructions

To use the storefront, just clone this repository (the `master` branch is usually fine). Fill in the installation settings in `app/settings.js` according to your environment, and serve the `app` folder statically using the web server of your choice.

## Customisation

### Architecture overview

The storefront offers a series of applications that can be launched by the user. Each application has a definition in `app/app_definitions.js` that defines its name, settings, cost, the environment it belongs to and the "API recipe" that allows to configure launch it.
When an application is launched the corresponding API recipe is called with the parameters chosen by the user. The recipe is responsible for creating a Farm in Scalr that corresponds to what the user wants, and launch it. It usually does so by cloning a base Farm, and customizing it for the user.

### Application settings

Application settings are stored in `app/app_definitions.js`. The settings for each application are stored in the application definition. The suffix of the setting name defines its type:

- xxxList for a set of options
- xxxField for a text field
- xxxBox for a checkbox

The prefix of the setting will be the option name when passed to the recipe.
The label that will be displayed for this setting is set in the `identifierToLabel` function.
The `recipeId` property of the definition is the name of the recipe that will be used to launch this application.

### API Recipes

API Recipes are a generic way to chain API calls, that in this case we use to clone a base Farm, customize its Farm Roles, and launch it. To add an application to the storefront, you usually need to create a new recipe and register it. Take inspiration from the existing recipes in `app/recipes.js` to see how this can be done. If you want to add a parameter to an existing app, modify its recipe to take the new parameter into account. 

