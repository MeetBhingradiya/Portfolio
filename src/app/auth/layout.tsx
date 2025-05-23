import Libraries from "@Lib";
import "@Styles/Auth.sass";

// @ File
export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <>
            <Libraries.reactbits.Backgrounds.Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={0.5}
                amplitude={1.0}
                speed={0.5}
            />
            <Libraries.reactbits.Backgrounds.Particles
                className="custom-particles"
                particleColors={['#ffffff', '#ffffff']}
                particleCount={200}
                particleSpread={10}
                speed={0.1}
                particleBaseSize={100}
                moveParticlesOnHover={true}
                alphaParticles={false}
                disableRotation={false}
            />
            {children}
        </>
    );
}