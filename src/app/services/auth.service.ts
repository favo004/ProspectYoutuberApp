import { Injectable } from '@angular/core';
import { IUser, IRole } from '../models/user';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, map } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';
import { GlobalMessageService } from './global-message.service';
import { HTTP_UTILS } from '../utils/utilities';

@Injectable({
  providedIn: 'root'
})
export class AuthService{

  loginUrl = environment.apiUrl + "login"

  currentUser: IUser;
  redirectUrl: string;
  errorMessage: any;
  retrievingUser = false;
  retrievingRole = false;

  constructor(private http: HttpClient,
              private userService: UserService,
              private gmService: GlobalMessageService,
              private router: Router) { this.init(); }

  init(): void{
    var currentUser = JSON.parse(localStorage.getItem('currentUser')); 
    if(currentUser !== null){
      this.currentUser = currentUser;
      this.getUserRole(currentUser.role_id);
    }
  }

  login(username:string, password:string){
    this.retrievingUser = true;
    return this.http.post<any>(this.loginUrl, {username: username, password: password}).pipe(
      map(user =>{
        if(user){
          this.getUserRole(user.role_id);
          this.setUpCurrentUser(user);
          this.retrievingUser = false;
          this.gmService.addMessage(`Welcome ${user.username}!`, "info");
          console.log(user);
        }
        return user;
      }),
      catchError(HTTP_UTILS.handleError)
    )
  }

  logout():void{
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.gmService.addMessage("Successfully logged out", "info");
    this.router.navigate(['/']);

  }

  isLoggedIn():boolean{
    return !!localStorage.getItem('currentUser');
  }

  isMaster():boolean{
    if(!this.currentUser){
      return false;
    }

    if(this.currentUser.role){
      return this.currentUser.role.type === "Master";
    }

    return false;
  }

  isAdmin():boolean{
    if(!this.currentUser){
      return false;
    }

    if(this.currentUser.role){
      return this.currentUser.role.type === "Admin";
    }

    return false;
  }

  setUpCurrentUser(user: IUser){
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    var cartStore = JSON.parse(localStorage.getItem('cart'));
    if(cartStore){
      if(user.username !== cartStore['user']){
        localStorage.removeItem('cart');
      }
    }
  }

  getUserRole(id:number){
    if(id){
      this.retrievingRole = true;
      this.userService.getRoleById(id).subscribe({
        next: role => {
          this.currentUser.role = role; 
          this.retrievingRole = false;
        },
        error: err => {
          this.errorMessage = err; 
          this.retrievingRole = false;
        }
      });
    }else{
      console.error("There was an issue getting role of user on storage");
    }
  }
}
