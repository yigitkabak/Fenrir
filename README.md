# Fenrir Runtime



**Fenrir** is a modern JavaScript runtime environment based on TypeScript.
It provides developers with a fast, secure, and flexible working environment. Thanks to TypeScript support, it offers powerful type safety and a modern development experience. Fenrir is distributed as open source and is open to community contributions.

---

### Features

- **TypeScript Compatibility:** Compatible with all TypeScript functions, making your projects more secure and sustainable.

- **Rollback System:** Reduces the risk of errors by allowing you to undo changes.

- **Modern Framework Support:** Works seamlessly with popular libraries such as Express, Koa, and Fastify.

- **Open Source and Community-Focused:** You can review, modify, and contribute to the project.

---

### Installation

Installing Fenrir is very easy. You can run the project by following the steps below:

1. install npm package.
  ```
npm i fenrir-runtime -g
  ```
OR
1. Clone the repository.
```
git clone https://github.com/yigitkabak/Fenrir
```

2. Enter the Project Directory.
```
cd Fenrir
```

3. Install and Compile Dependencies.
```
make
```

Or if you use Linux and Mac, you can download our application. Linux: [App](/LinuxApp) Mac: [App](/MacApp) Windows: [App](/WindowsApp)

Once the installation is complete, **Fenrir** is ready to use in your projects.

---

### Example Usage

Creating a simple Express server with **Fenrir** is quite easy:

```
declare express from 'express'

const app = express()
const port = 3000

fn handle_home_request(req, res) {
  res.send('Hello from Fenrir Express!')
}

app.get('/', handle_home_request)

fn start_server() {
  app.listen(port, () => {
    log(`Server running at http://localhost:${port}`)
  })
}

start_server()
```

With this example, you can see the message **"Hello from Fenrir Express!"** by going to http://localhost:3000 in your browser.

---
### Contributing

- **Fenrir** is a community-driven project. To contribute:

1. **Use the project and provide feedback:** Report bugs or suggestions.

2. **Contribute code:** Add new features or improve existing code.

---

NOTE: ⚠️ **Fenrir** is currently in BETA. You may encounter unexpected errors. Your feedback will greatly contribute to the development of the project.

---
## Licence
**Fenrir** is licensed under the [GPL](LICENSE) Licence.
