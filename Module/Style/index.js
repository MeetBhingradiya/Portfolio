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



const Top = ScrollReveal({
    origin: 'top',
    distance: '100px',
    duration: 2000
});



const Bottom = ScrollReveal({
    origin: 'bottom',
    distance: '100px',
    duration: 2000,
    reset: true
});




const NonResetRight = ScrollReveal({
    origin: 'right',
    distance: '100px',
    duration: 2000,
    reset:false
});
NonResetRight.reveal('.Links',{delay: 200}); 
// NonResetRight.reveal('.personimg',{delay: 200});

const NonResetLeft = ScrollReveal({
    origin: 'left',
    distance: '100px',
    duration: 2000,
    reset:false
});
NonResetLeft.reveal('.brand',{delay: 200}); 