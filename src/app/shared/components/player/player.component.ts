import {Component, OnInit, OnDestroy, HostListener, style, state, animate, transition, trigger} from '@angular/core';
import {Song} from "../../models/song";
import {Subscription, Observable} from "rxjs";
import {PlayerService} from "../../services/player.service";
import {CLIENT_ID_PARAM} from "../../utilities/constants";
import {isNullOrUndefined} from "util";
import {UserService} from "../../services/user.service";
import {LayoutService} from "../../services/layout.service";
import {SessionService} from "../../authentication/session.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})

export class PlayerComponent implements OnInit, OnDestroy {

  private audio: any = new Audio;
  private song: Song;
  private current_time: number = 0;
  private full_time: number = 0;
  private song_subscription: Subscription;
  private is_playable: boolean = false;
  private is_playing: boolean = false;
  private is_repeating: boolean = false;
  private is_updating_vol: boolean = false;
  private is_authed: boolean;
  private session_status_subscription: Subscription;

  constructor(private _playerService: PlayerService, private _userService: UserService, private _layoutService: LayoutService, private _sessionService: SessionService, private _router: Router) {
    this.song_subscription = this._playerService.getCurrentSong().subscribe(
      res => this.setPlayer(res),
      err => console.log(Observable.throw(err))
    );
    this.session_status_subscription = this._sessionService.getUserSession().subscribe(
      res => {
        this.is_authed = res.authed;
      }
    )
  }

  ngOnInit() {
  }

  private setPlayer(song: Song) {
    this.song = song;
    this.is_playable = false;
    this.audio.src = song.audio + `?${CLIENT_ID_PARAM}`;
    this.audio.load();

    this.audio.addEventListener('canplaythrough', () => {
      this.is_playable = true;
      this.audio.play();
      this.full_time = this.audio.duration;
    });


    this.audio.addEventListener('timeupdate', () => {
      this.current_time = this.audio.currentTime;
      this.is_playing = true;
    });

    this.audio.addEventListener('pause', () => {
      this.is_playing = false;
    });

    this.audio.addEventListener('play', () => {
      this.is_playing = true;
    });

    this.audio.addEventListener('ended', () => {
      this.is_playing = false;
      if (this.is_repeating) {
        this.setPlayer(this.song);
      } else {
        this.getNextSong();
      }
      this.audio.removeEventListener('ended');
    });
  }

  private togglePlay() {
    if (this.is_playing) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
  }

  private addToUserPlaylist() {
    this._playerService.addToUserPlaylist(this.song);
  }

  private addToFavorites() {
    if (this.is_authed) {
      this._userService.addToFavorite(this.song).subscribe(
        res => this.buildNotification("Added to favorites", "default"),
        err => console.log(err)
      );
    } else {
      this._router.navigate(['/user/sign-in'])
    }
  }

  private getNextSong() {
    this._playerService.getNextSong();
  }

  private getPreviousSong() {
    this._playerService.getPreviousSong();
  }

  private setCurrentTime(value: number) {
    this.audio.currentTime = value;
  }

  private setCurrentVol(value: number) {
    this.audio.volume = value;
  }

  private toggleVolControl(value?: boolean) {
    if (value) {
      this.is_updating_vol = value;
    } else {
      this.is_updating_vol = !this.is_updating_vol;
    }
  }

  private toggleRepeat() {
    this.is_repeating = !this.is_repeating;
  }

  private buildNotification(message: string, type: string) {
    this._layoutService.buildNotification(message, type);
  }

  @HostListener('document:keypress', ['$event'])
  private handleKeyEvent(event: KeyboardEvent) {
    if ((event.keyCode == 32 || event.charCode == 32) && !isNullOrUndefined(this.song)) {
      if (event.srcElement) {
        if (event.srcElement.tagName != "INPUT") {
          event.preventDefault();
          this.togglePlay();
        }
      } else {
        event.preventDefault();
        this.togglePlay();
      }
    }
  }

  ngOnDestroy() {
    this.song_subscription.unsubscribe();
  }

}
