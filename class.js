class OfertaElemento extends HTMLElement {

   constructor() {
     super();
  
   console.log("Constructor ", this);
   }

}

customElements.define("oferta-elemento", OfertaElemento);