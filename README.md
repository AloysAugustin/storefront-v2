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

TODO: Add support for global variables in the launch form (the list of which can be put in the farm description) to be able to customize stuff on the launched Farms, such as credentials

