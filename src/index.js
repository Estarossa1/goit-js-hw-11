import './css/styles.css';
import 'simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';
import API from './js/API';
import gallery from './js/gallery';
import { Notify } from 'notiflix';


const binds = {
  form: document.querySelector('.search-form'),
  input: document.querySelector('.search-form__input'),
  button: document.querySelector('.search-form__button'),
  gallery: document.querySelector('.gallery'),
  loader: document.querySelector('.loader'),
};

const newApi = new API();
const newGallery = new gallery();
const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionPosition: 'bottom',
  captionDelay: 250,
});

let inputEmpty = true; 
let showedImages = 0; 
let totalHits = 0; 

binds.form.addEventListener('submit', onFormSubmit);
binds.input.addEventListener('input', onInput);
// binds.loader.addEventListener('click', onLoadMore)
// binds.button.addEventListener('click', onButtonClick);

function onInput(e) {
  if (e.target.value) {
    inputEmpty = false;
    binds.button.removeAttribute('disabled');
  } else {
    inputEmpty = true;
    binds.button.setAttribute('disabled', 'disabled')
  }
}

function onFormSubmit(e) {
  e.preventDefault();
  if (inputEmpty) {
    return;
  } 

  stopObserver(); 
  binds.gallery.innerHTML = '';
  showedImages = 0; 
  totalHits = 0;
  // виводить текст в input
  const query = e.target.elements.searchQuery.value;
  // console.log(query);

  loadingImages(query);
}

async function loadingImages(query) {
  try {
    const data = await newApi.loadNewPages(query);
    // виводить кількість результатів
    // console.log(data) 
    if (data.totalHits === 0) {
      Notify.failure('Sorry, there are no images matching your search query. Please try again.');
      return;
    }

    totalHits = data.totalHits;
    Notify.success(`Hooray! We found ${totalHits} images.`)
    buildGalery(data);
    lightbox.refresh();
    showedImages = data.hits.length;

    if (showedImages < totalHits) {
      binds.loader.removeAttribute('hidden');
      startObserver();
    }
  }
  catch (error) {
    console.error(error);
  }
}

async function onLoadMore(query) {

  try {
    const array = await newApi.loadMorePagesLoading(query); 

    if (showedImages === totalHits) {
      stopObserver();
      binds.loader.setAttribute('hidden', 'hidden');
      Notify.info("We're sorry, but you've reached the end of search results.");
    } appendGallery(array);
      lightbox.refresh();
      showedImages += array.hits.length;

  } catch (error) {
    console.error(error)
  }
}

function appendGallery(array) {
  const markup = newGallery.createCards(array.hits);
  binds.gallery.insertAdjacentHTML('beforeend', markup);
}

// 
function buildGalery(data) {
  const markup = newGallery.createCards(data.hits);
  // виводить в консоль скелет карток
  // console.log(markup);
  binds.gallery.innerHTML = markup;
}

const scrollObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        onLoadMore();
      }
    });
  },

  {
    rootMargin: '0px 0px 300px 0px',
    threshold: 0.1,
  }
);

function startObserver() {
  setTimeout(function () {
    scrollObserver.observe(binds.loader); 
  }, 1000);
}

function stopObserver() {
  scrollObserver.unobserve(binds.loader); 
}