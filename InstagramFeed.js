const templateInstagram = document.createElement("template");

templateInstagram.innerHTML = `
<div class="feed"></div>

<style>
.feed{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}
.feed a{
  display:block;
}
.feed img{
  width: 100%;
  height: auto;
  border-radius: 12px;
  display: block;
}
</style>
`;

class InstagramFeed extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.append(templateInstagram.content.cloneNode(true));
    this.cargarFeed();
  }

  async cargarFeed() {
    // Datos simulados: usa tus imágenes reales y miniaturas
    const publicaciones = [
      { imagen: "foto1.jpg", link: "[instagram.com](https://www.instagram.com/dany_moreno19/)" },
      { imagen: "foto2.jpg", link: "[instagram.com](https://www.instagram.com/dany_moreno19/)" }
    ];

    const feed = this.shadowRoot.querySelector(".feed");

    publicaciones.forEach(post => {
      const a = document.createElement("a");
      a.href = post.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.src = post.imagen;
      img.alt = "Publicación de Instagram";

      a.appendChild(img);
      feed.appendChild(a);
    });
  }
}

customElements.define("instagram-feed", InstagramFeed);
