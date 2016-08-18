# Scalr Storefront v2

Simple interface that allows to launch Farms in Scalr using the APIv2

This is a simple, fully client-side app that serves as a storefront for Scalr

All the data is stored inside Scalr. To configure some templates in an environment and be able to launch them from the storefront, do the folloxing:
- Create a template Farm that suits your needs. This can be anything from just an Ubuntu server to for instance a Docker Swarm cluster.
- Make the name of this Farm begin by `[TEMPLATE]`
- Put a JSON blob in the description field of the Farm, according to this example:
```
{
  "logo": "http://design.ubuntu.com/wp-content/uploads/ubuntu-logo112.png",
  "description": "Just an ubuntu server",
  "dailyPrice": "1.06"
}
```

Note: this is experimental and unstable code, most errors are logged in the console but not displayed in the UI

Templates farms can be customized in two ways:
- Setting a farm-level global variable called STOREFRONT_CONFIGURABLE_GV that contains a JSON-formatted list of global variable names (ex: ["ACCOUNT_NAME", "ACCOUNT_PW"]) will allow the storefront user to give a custom value to these global variables.
- Setting a farm-role level global variable called STOREFRONT_SCALING_ENABLED will allow the user to choose the number of instances for this farm role. Min, max and default number of instances can be configured with the value of STOREFRONT_SCALING_ENABLED:
```
{
"min": 1,
"max": 5,
"value": 1
}
```

TODO: Reflect impact of scaling choices in estimated price
