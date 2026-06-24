import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { useAuth0 } from "@auth0/auth0-react";

//Auth0 endpoint credentials
const Auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN as string;
const Auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const Auth0Site = import.meta.env.VITE_AUTH0_ADDRESS as string;
const BASE_URL = import.meta.env.VITE_BASE_URL_FRONTEND as string;

interface Props {
  handleSiteChange: any;
  AllSites: any;
  userPermissions: any;
  toggleProcessing: any;
  showProcessing: any;
}

function UserDropdown() {
  const { user, logout, getAccessTokenSilently } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { /*returnTo: Auth0Site*/ } });
  };

  return (
    <DropdownButton
      id="user-dropdown-button"
      className="electronet-dropdown"
      title={user?.name || "User"}
      style={{ marginLeft: "10px" }}
    >
      {/* <Dropdown.Item onClick={handleChangePassword}>
        Change Password
      </Dropdown.Item> */}
      <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
    </DropdownButton>
  );
}

function Header({
  handleSiteChange,
  AllSites,
  userPermissions,
  toggleProcessing,
  showProcessing,
}: Props) {
  return (
    <div className="header-container">
      <img height="100%" src={`${BASE_URL}ElectroNet_Blue.png`}></img>
      <div className="header-buttons">
        {userPermissions === "Admin" && showProcessing === false && (
          <button
            className="electronet_btn admin"
            style={{ marginRight: "20px" }}
            onClick={toggleProcessing}
          >
            Processing
          </button>
        )}
        {userPermissions === "Admin" && showProcessing === true && (
          <button
            className="electronet_btn admin"
            style={{ marginRight: "20px" }}
            onClick={toggleProcessing}
          >
            Main View
          </button>
        )}
        <DropdownButton
          id="site-change-button"
          className="electronet-dropdown"
          title="Site"
          style={{ marginRight: "10px" }}
        >
          <Dropdown.Item
            key="home"
            onClick={() => handleSiteChange("home", "", undefined)}
          >
            Home
          </Dropdown.Item>
          {typeof AllSites !== "undefined" &&
            AllSites.map((item: any, index: number) => {
              const siteName = item[0];
              const ownerName = item[1];
              const testDate = item[2];
              const revision = item[3];
              const testReportUuid = item[4];
              const metadata = item[5];
              
              return (
                <Dropdown.Item
                  key={`${siteName}-${revision}-${index}`}
                  onClick={() => handleSiteChange(siteName, ownerName, metadata)}
                >
                  {siteName} - {revision || "Rev00"}
                </Dropdown.Item>
              );
            })}
        </DropdownButton>
        <UserDropdown />
      </div>
    </div>
  );
}

export default Header;