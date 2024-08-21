import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
} from "@nextui-org/react";

const AppNavbar = () => {
  return (
    <Navbar
      classNames={{
        wrapper: "flex-direction: column;",
      }}
    >
      <NavbarBrand>
        <p>this is the navbar brand</p>
      </NavbarBrand>
      <NavbarContent>
        <NavbarItem>
          <Link href={"/"}>link1</Link>
        </NavbarItem>
        <NavbarItem>
          <Link href={"/2"}>link2</Link>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default AppNavbar;
