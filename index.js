const { Webhook, MessageBuilder } = require("discord-webhook-node");
const fs = require("fs");
const chalk = require("chalk");

const hook = new Webhook(
  "https://discord.com/api/webhooks/1101727190913134593/7qGrNbhO2r6bg0h6bI1bHRnRBlAJAtS8cAgneHjFOhZaeNDMKOi6oBULGy1SHmmctPIz"
);

const logs = new Webhook(
  "https://discord.com/api/webhooks/1074057027430662285/dhXD6YuPap-ojXVkDDpvYkOLxY4OtYGPQwtbN2iQ9fDbMWhGSqyPa2ImeXTiL1-9ATcg"
);

const url = "https://lethalgaminggear.com/";
let isFirstRun = true;
let lastProductCount = 0;

function getDaysAgo(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const timeDiff = today.getTime() - date.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  if (daysDiff === 0) {
    return "today";
  } else if (daysDiff === 1) {
    return "yesterday";
  } else {
    return `${daysDiff} days ago`;
  }
}

function firstInterval(f, m, ...p) {
  const h = setInterval(() => {
    f.apply(null, p);
  }, m);
  f.apply(null, p);
  return h;
}

function checkProducts() {
  const now = new Date();
  const mstOptions = { timeZone: "America/Denver" };
  const mstTime = now.toLocaleString("en-US", mstOptions);

  const checking = new MessageBuilder()
    .setTitle("Checking for products ...")
    .setDescription(`Current time and date (MST): ${mstTime}`)
    .setColor("#00ff00");

  logs.send(checking);

  fetch(`${url}products.json`)
    .then((response) => response.json())
    .then((data) => {
      if (isFirstRun) {
        // On the first run, send a message with the first 5 products
        const message = new MessageBuilder()
          .setTitle("Last 5 products added")
          .setDescription(
            data.products
              .slice(0, 5)
              .map(
                (product) =>
                  `${product.vendor} - ${product.title} ($${
                    product.variants[0].price
                  }) - [Link](${url}products/${
                    product.handle
                  }) - Added: ${getDaysAgo(product.created_at)}`
              )
              .join("\n")
          )
          .setColor("#00ff00");

        hook.send(message).then(() => {
          const resume = new MessageBuilder()
            .setTitle("Resuming monitoring ...")
            .setColor("#00ff00");

          return hook.send(resume);
        });

        isFirstRun = false;
        lastProductCount = data.products.length;
        return;
      }

      if (data.products.length > lastProductCount) {
        // If there are new products, send a message to the webhook
        const newProducts = data.products.slice(lastProductCount);
        const message = new MessageBuilder()
          .setTitle("New products added!")
          .setDescription(
            newProducts
              .map(
                (product) =>
                  `${product.vendor} - ${product.title} ($${product.variants[0].price})`
              )
              .join("\n")
          )
          .setColor("#00ff00");
        hook.send("@everyone");
        hook.send(message);

        lastProductCount = data.products.length;
      }
    })
    .catch((error) => console.error(error));
}



 function main() {
  checkProducts();
  setInterval(checkProducts, 3600000);
}

main();

