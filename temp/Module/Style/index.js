const Links = document.querySelectorAll('.li')

/*===== Links Activator =====*/
function Activator(i)
    {
        for(Link of Links)
        Link.classList.remove('active');
        Links[i].classList.add('active');
    }
for (let j = 0;j<Links.length;j++)
    {
        Links[j].addEventListener('click',()=>{
            Activator(j);
        })
    }


/*===== Scroll Animation =====*/

// Non Resetable Right
const NonResetRight = ScrollReveal({
    origin: 'right',
    distance: '100px',
    duration: 2000,
    reset:false
});
NonResetRight.reveal('.Links',{delay: 150});


// Non Resetable Left
const NonResetLeft = ScrollReveal({
    origin: 'left',
    distance: '100px',
    duration: 2000,
    reset:false
});
NonResetLeft.reveal('.brand',{delay: 150}); 


// Non Resetable Top
const NonResetTop = ScrollReveal({
    origin: 'top',
    distance: '100px',
    duration: 2000,
    reset:false
});


// Non Resetable Bottom
const NonResetBottom = ScrollReveal({
    origin: 'bottom',
    distance: '100px',
    duration: 2000,
    reset:false
});


// Resetable Right
const Right = ScrollReveal({
    origin: 'right',
    distance: '100px',
    duration: 2000,
    reset:true
});


// Resetable Left
const Left = ScrollReveal({
    origin: 'left',
    distance: '100px',
    duration: 2000,
    reset:true
});


// Resetable Top
const Top = ScrollReveal({
    origin: 'top',
    distance: '100px',
    duration: 2000,
    reset:true
});


// Resetable Bottom
const Bottom = ScrollReveal({
    origin: 'bottom',
    distance: '100px',
    duration: 2000,
    reset:true
});